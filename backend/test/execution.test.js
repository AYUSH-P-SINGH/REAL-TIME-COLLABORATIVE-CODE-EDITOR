const executionService = require('../src/execution/execution.service');

describe('Sandboxed Code Execution Engine', () => {
  it('should successfully execute JavaScript code and capture stdout', async () => {
    const code = `
      const a = 10;
      const b = 20;
      console.log('Result is: ' + (a + b));
    `;

    const result = await executionService.executeCode({
      language: 'javascript',
      code
    });

    expect(result.status).toBe('success');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('Result is: 30');
    expect(result.executionTimeMs).toBeGreaterThan(0);
  });

  it('should capture runtime errors and exit with non-zero code', async () => {
    const code = `
      throw new Error('Sandbox deliberate crash');
    `;

    const result = await executionService.executeCode({
      language: 'javascript',
      code
    });

    expect(result.status).toBe('error');
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Sandbox deliberate crash');
  });

  it('should enforce timeout and terminate infinite loops safely', async () => {
    const code = `
      while (true) {}
    `;

    const result = await executionService.executeCode({
      language: 'javascript',
      code,
      timeoutMs: 1500
    });

    expect(result.status).toBe('timeout');
    expect(result.stderr).toContain('Execution timed out');
  }, 5000);

  it('should sanitize environment variables and protect host credentials', async () => {
    process.env.SUPER_SECRET_KEY = 'super_secret_db_password_123';

    const code = `
      console.log('SECRET:' + (process.env.SUPER_SECRET_KEY || 'NOT_FOUND'));
    `;

    const result = await executionService.executeCode({
      language: 'javascript',
      code
    });

    expect(result.stdout).toBe('SECRET:NOT_FOUND');
    delete process.env.SUPER_SECRET_KEY;
  });
});
