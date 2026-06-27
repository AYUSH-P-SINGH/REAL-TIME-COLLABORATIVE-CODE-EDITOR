# Contributing Guide

Thank you for your interest in contributing to the Real-Time Collaborative Code Editor! This guide will help you get started.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/REAL-TIME-COLLABORATIVE-CODE-EDITOR.git
   cd REAL-TIME-COLLABORATIVE-CODE-EDITOR
   ```

3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Follow the setup guide** in [SETUP.md](SETUP.md)

## 📝 Commit Guidelines

### Commit Message Format
Use clear, descriptive commit messages following this pattern:

```
type(scope): subject

body

footer
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Test addition/modification
- `chore:` - Build, dependencies, etc.

**Examples:**
```
feat(auth): add JWT token refresh endpoint
fix(socket): correct cursor position tracking
docs(setup): update installation instructions
refactor(socket): simplify room manager
```

## 🏗️ Project Structure Guidelines

### Backend

**Controllers** (`src/*/controller.js`)
- Handle HTTP requests/responses
- Parse request data
- Call services
- Return appropriate status codes

**Services** (`src/*/service.js`)
- Implement business logic
- Handle data transformation
- Interact with models
- Should be testable

**Models** (`src/*/model.js`)
- Define MongoDB schemas
- Add validations
- Create indexes
- Include timestamps

**Routes** (`src/*/routes.js`)
- Define endpoints
- Include middleware
- Add request/response validation

**Middleware** (`src/middlewares/`)
- Cross-cutting concerns
- Error handling
- Authentication
- Request validation

### Frontend

**Components** (`src/components/`)
- Functional components only
- Use React hooks
- Keep components focused
- Extract reusable logic to hooks

**Hooks** (`src/hooks/`)
- Custom hooks for reusable logic
- Use React hooks internally
- Well-documented with JSDoc

**Context** (`src/context/`)
- Global state management
- Provider pattern
- Clear state structure

**Services** (`src/services/`)
- API communication
- External integrations
- Utility functions

**Pages** (`src/pages/`)
- Page-level components
- Route components
- Compose smaller components

## 🎨 Code Style

### Backend (Node.js/JavaScript)

**Naming Conventions:**
```javascript
// camelCase for variables/functions
const userData = {};
const getUserData = () => {};

// PascalCase for classes
class UserService {}

// UPPER_SNAKE_CASE for constants
const MAX_CONNECTIONS = 100;
```

**Code Formatting:**
```javascript
// Use 2-space indentation
// Max line length: 100 characters
// Use const/let, avoid var

// Use async/await instead of .then()
const data = await service.fetchData();

// Use meaningful variable names
// ✓ Good
const userData = await User.findById(userId);

// ✗ Avoid
const u = await User.findById(uid);
```

### Frontend (React)

**Naming Conventions:**
```javascript
// Components: PascalCase
export function MyComponent() { }

// Hooks: camelCase starting with 'use'
const useCustomHook = () => {};

// Props interface
const ComponentProps = { ... };
```

**Component Structure:**
```javascript
import React, { useState, useEffect } from 'react';
import { useContext } from 'react';

export function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(null);
  const context = useContext(MyContext);

  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [dependency]);

  const handleClick = () => {
    // Handler logic
  };

  return (
    // JSX
  );
}

export default MyComponent;
```

## 🧪 Testing

### Running Tests

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm test
```

### Writing Tests

**Backend Test Example:**
```javascript
// test/services/user.service.test.js
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = { email: 'test@example.com', password: 'pass' };
      const result = await userService.createUser(userData);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });

    it('should throw error for duplicate email', async () => {
      const userData = { email: 'duplicate@example.com', password: 'pass' };
      
      await expect(userService.createUser(userData))
        .rejects.toThrow('Email already exists');
    });
  });
});
```

**Frontend Test Example:**
```javascript
// test/components/MyComponent.test.jsx
import { render, screen } from '@testing-library/react';
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  it('should render component', () => {
    render(<MyComponent prop1="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

## 🐛 Bug Reports

### Creating a Bug Report

Use GitHub Issues with the bug template:

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Bug occurs

## Expected Behavior
What should happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., Windows 10]
- Node version: [e.g., 18.0.0]
- Browser: [e.g., Chrome 120]
```

## ✨ Feature Requests

### Suggesting a Feature

Use GitHub Issues with the feature template:

```markdown
## Is your feature request related to a problem?
Describe the problem

## Describe the solution you'd like
Clear description of desired feature

## Describe alternatives you've considered
Alternative approaches

## Additional context
Any additional information
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update ARCHITECTURE.md if architecture changes

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Lint Code**
   - Backend: Follow existing style
   - Frontend: `npm run lint`

4. **Test Functionality**
   - Manual testing
   - Verify no regressions
   - Test edge cases

### PR Description

```markdown
## Description
Brief description of changes

## Related Issue
Fixes #123 (if applicable)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
Describe how you tested changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

## 📚 Documentation Guidelines

### Code Comments

```javascript
// Single line comments for simple explanations
const result = calculate(data); // Quick note

/**
 * Detailed explanation of what function does
 * @param {string} param1 - Description of param1
 * @param {number} param2 - Description of param2
 * @returns {Promise<Object>} Description of return value
 */
function complexFunction(param1, param2) {
  // Implementation
}
```

### Markdown Documentation

- Use clear headings hierarchy (# > ## > ###)
- Include code examples
- Use proper formatting
- Keep lines <= 100 characters
- Link to related docs

## 🚀 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub Release
6. Deploy to production

## 📋 Code Review Checklist

Reviewers should verify:

- [ ] Code follows style guide
- [ ] No console.log statements left
- [ ] No debug code
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security issues
- [ ] No performance regressions
- [ ] Error handling implemented
- [ ] No breaking changes

## 🎯 Development Workflow

### Feature Development
```
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create PR
5. Address review comments
6. Merge to main
```

### Bug Fixes
```
1. Create bug branch
2. Fix issue
3. Add regression test
4. Create PR
5. Review and merge
```

### Documentation
```
1. Create docs branch
2. Update documentation
3. Review changes
4. Merge to main
```

## 🤝 Community Guidelines

### Be Respectful
- Treat everyone with respect
- Be welcoming to newcomers
- Constructive feedback only
- No harassment or discrimination

### Communicate Clearly
- Use clear language
- Explain your reasoning
- Ask questions if unclear
- Provide context

### Help Others
- Answer questions in issues
- Review PRs constructively
- Share knowledge
- Mentor new contributors

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Issues**: Search existing issues first
- **Chat**: Community Discord (if available)
- **Email**: Project maintainers

## 📝 License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing! 🎉
