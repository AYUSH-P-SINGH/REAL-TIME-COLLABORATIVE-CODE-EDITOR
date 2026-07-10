// Backend Auth Service Tests
const { request, app } = require('./setup');
const User = require('../src/user/user.model');
const authService = require('../src/auth/auth.service');

describe('Authentication Service', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const result = await authService.register(
        userData.name,
        userData.email,
        userData.password
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
    });

    it('should fail if email already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      await authService.register(
        userData.name,
        userData.email,
        userData.password
      );

      await expect(
        authService.register(
          'Another User',
          userData.email,
          'AnotherPass123!'
        )
      ).rejects.toThrow('User already exists');
    });

    it('should fail with invalid email', async () => {
      await expect(
        authService.register(
          'Test User',
          'invalid-email',
          'SecurePass123!'
        )
      ).rejects.toThrow();
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      await authService.register(
        userData.name,
        userData.email,
        userData.password
      );
    });

    it('should login successfully with correct credentials', async () => {
      const result = await authService.login(
        'test@example.com',
        'SecurePass123!'
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should fail with incorrect password', async () => {
      await expect(
        authService.login('test@example.com', 'WrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should fail with non-existent user', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'SecurePass123!')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
