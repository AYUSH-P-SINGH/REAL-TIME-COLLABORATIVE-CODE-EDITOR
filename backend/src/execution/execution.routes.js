const express = require('express');
const { z } = require('zod');
const { protect } = require('../auth/auth.middleware');
const executionService = require('./execution.service');

const router = express.Router();

const executionSchema = z.object({
  language: z.enum(['javascript', 'python', 'bash']),
  code: z.string().min(1, 'Code snippet cannot be empty').max(50000, 'Code snippet exceeds 50KB limit'),
  stdin: z.string().max(10000).optional(),
  timeoutMs: z.number().min(500).max(10000).optional(),
  docId: z.string().optional()
});

/**
 * Run or Queue Code Execution
 * By default in modern REST, returns 202 Accepted with poll URL and async job tracking.
 * If ?sync=true is specified, waits synchronously for execution and returns 200 OK.
 */
const handleRunOrQueue = async (req, res, next) => {
  try {
    const validated = executionSchema.parse(req.body);
    const isSync = req.query.sync === 'true';

    if (isSync) {
      const result = await executionService.executeCode({
        language: validated.language,
        code: validated.code,
        stdin: validated.stdin || '',
        timeoutMs: validated.timeoutMs || 3500
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    }

    // Async execution returning 202 Accepted
    const io = req.app.get('io');
    const job = await executionService.queueExecution({
      language: validated.language,
      code: validated.code,
      stdin: validated.stdin || '',
      timeoutMs: validated.timeoutMs || 3500,
      docId: validated.docId,
      io
    });

    res.setHeader('Location', `/api/v1/executions/${job.executionId}`);
    return res.status(202).json({
      success: true,
      executionId: job.executionId,
      status: job.status,
      pollUrl: `/api/v1/executions/${job.executionId}`,
      message: 'Code execution job queued successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid execution parameters',
        errors: error.errors
      });
    }
    next(error);
  }
};

router.post('/run', protect, handleRunOrQueue);
router.post('/', protect, handleRunOrQueue);

// Poll execution status
router.get('/:id', protect, async (req, res, next) => {
  try {
    const job = await executionService.getExecutionStatus(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Execution job not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: job
    });
  } catch (err) {
    next(err);
  }
});

// Languages supported endpoint
router.get('/languages', (req, res) => {
  res.status(200).json({
    success: true,
    languages: Object.keys(executionService.SUPPORTED_LANGUAGES)
  });
});

module.exports = router;
