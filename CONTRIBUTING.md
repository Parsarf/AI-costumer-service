# Contributing to Shopify AI Support Bot

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain professional communication

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/shopify-support-bot/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with the `enhancement` label
3. Clearly describe:
   - The problem you're solving
   - Your proposed solution
   - Alternative solutions considered
   - Any additional context

### Pull Requests

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Test your changes**
   ```bash
   npm test
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "Add feature: brief description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description
   - Reference any related issues
   - Include screenshots for UI changes

## Development Setup

See [README.md](README.md) for setup instructions.

## Coding Standards

### JavaScript/Node.js

- Use ES6+ features
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use `const` and `let`, avoid `var`
- Use async/await over promises
- Handle errors properly

### React

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component names
- Avoid inline styles (use CSS)

### Database

- Write efficient queries
- Use indexes appropriately
- Handle migrations properly
- Never commit sensitive data

### API Design

- Follow REST conventions
- Use appropriate HTTP methods
- Return consistent error responses
- Document all endpoints

## Testing

- Write tests for new features
- Maintain > 80% code coverage
- Test edge cases
- Include integration tests

## Documentation

- Update README.md for new features
- Add JSDoc comments for functions
- Update API.md for API changes
- Include examples

## Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructure
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(chat): add message threading
fix(auth): resolve HMAC validation bug
docs(api): update webhook documentation
```

## Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, PR will be merged
4. Your contribution will be credited

## Questions?

- Open an issue for general questions
- Email: support@yourdomain.com
- Join our community: [Discord/Slack link]

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉

