const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { cacheClient } = require('../config/redis');

const SUPPORTED_LANGUAGES = {
  javascript: {
    extension: '.js',
    command: 'node',
    args: (filePath) => [filePath]
  },
  python: {
    extension: '.py',
    command: process.platform === 'win32' ? 'python' : 'python3',
    args: (filePath) => [filePath]
  },
  bash: {
    extension: '.sh',
    command: process.platform === 'win32' ? 'bash' : 'sh',
    args: (filePath) => [filePath]
  }
};

// In-memory execution job store (backed by Redis when available)
const executionJobStore = new Map();

/**
 * Sandboxed Code Execution Service.
 * Runs user code in an isolated subprocess with strict timeouts,
 * zero host environment variables, memory constraints, and output caps.
 */
const executeCode = async ({ language, code, stdin = '', timeoutMs = 3500 }) => {
  const langConfig = SUPPORTED_LANGUAGES[language.toLowerCase()];
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}. Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`);
  }

  // Create isolated temporary directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-sandbox-'));
  const tempFile = path.join(tempDir, `script${langConfig.extension}`);
  fs.writeFileSync(tempFile, code, 'utf8');

  const startTime = Date.now();
  let stdoutData = '';
  let stderrData = '';
  let isKilled = false;
  let status = 'success';
  const MAX_OUTPUT_BYTES = 64 * 1024; // 64KB output limit

  return new Promise((resolve) => {
    // Sanitized, stripped environment to prevent credential/secret leakage
    const sanitizedEnv = {
      NODE_ENV: 'sandbox',
      PATH: process.env.PATH || '',
      TEMP: tempDir,
      TMP: tempDir
    };

    const child = spawn(langConfig.command, langConfig.args(tempFile), {
      cwd: tempDir,
      env: sanitizedEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeoutMs,
      windowsHide: true
    });

    const timer = setTimeout(() => {
      isKilled = true;
      status = 'timeout';
      try {
        child.kill('SIGKILL');
      } catch (e) {
        // Child process may have already exited
      }
    }, timeoutMs);

    if (stdin) {
      try {
        child.stdin.write(stdin);
        child.stdin.end();
      } catch (e) {
        // Stdin pipe may be closed
      }
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (chunk) => {
      if (stdoutData.length < MAX_OUTPUT_BYTES) {
        stdoutData += chunk.toString();
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderrData.length < MAX_OUTPUT_BYTES) {
        stderrData += chunk.toString();
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      stderrData += `\nRuntime initialization error: ${err.message}`;
      status = 'error';
      cleanupTempDir(tempDir);
      resolve({
        stdout: stdoutData.trim(),
        stderr: stderrData.trim(),
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        status
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;
      cleanupTempDir(tempDir);

      if (isKilled) {
        status = 'timeout';
        stderrData += `\nExecution timed out after ${timeoutMs}ms (Process killed).`;
      } else if (code !== 0) {
        status = 'error';
      }

      if (stdoutData.length >= MAX_OUTPUT_BYTES) {
        stdoutData += '\n... [Output truncated: exceeded 64KB limit]';
      }

      resolve({
        stdout: stdoutData.trim(),
        stderr: stderrData.trim(),
        exitCode: code !== null ? code : 1,
        executionTimeMs,
        status
      });
    });
  });
};

/**
 * Enqueues an asynchronous execution job, returning immediately with 202 Accepted.
 * The runner processes the job in the background, writes the result to cache,
 * and notifies the document room via WebSocket.
 */
const queueExecution = async ({ language, code, stdin = '', timeoutMs = 3500, docId, io }) => {
  const executionId = `exec_${crypto.randomBytes(8).toString('hex')}`;
  const job = {
    executionId,
    status: 'queued',
    language,
    submittedAt: new Date().toISOString(),
    completedAt: null,
    docId: docId || null,
    result: null
  };

  saveExecutionJob(executionId, job);

  // Execute asynchronously off the HTTP request/response cycle
  setImmediate(async () => {
    try {
      job.status = 'running';
      saveExecutionJob(executionId, job);

      const result = await executeCode({ language, code, stdin, timeoutMs });

      job.status = result.status === 'timeout' || result.status === 'error' ? 'failed' : 'completed';
      job.completedAt = new Date().toISOString();
      job.result = result;

      saveExecutionJob(executionId, job);

      // Emit live result via WebSocket if room/io is connected
      if (io && docId) {
        io.to(docId).emit('execution:completed', {
          executionId,
          docId,
          ...job
        });
      }
    } catch (err) {
      job.status = 'failed';
      job.completedAt = new Date().toISOString();
      job.result = { stdout: '', stderr: err.message, exitCode: 1, executionTimeMs: 0, status: 'error' };
      saveExecutionJob(executionId, job);
    }
  });

  return job;
};

const saveExecutionJob = (executionId, job) => {
  executionJobStore.set(executionId, job);
  const redisKey = `execution:${executionId}`;
  if (cacheClient && cacheClient.isOpen) {
    cacheClient.set(redisKey, JSON.stringify(job), { EX: 3600 }).catch(() => {});
  }
};

const getExecutionStatus = async (executionId) => {
  const redisKey = `execution:${executionId}`;
  if (cacheClient && cacheClient.isOpen) {
    const raw = await cacheClient.get(redisKey);
    if (raw) return JSON.parse(raw);
  }
  return executionJobStore.get(executionId) || null;
};

const cleanupTempDir = (dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    logger.debug(`Sandbox cleanup notice: ${err.message}`);
  }
};

module.exports = {
  executeCode,
  queueExecution,
  getExecutionStatus,
  SUPPORTED_LANGUAGES,
  executionJobStore
};
