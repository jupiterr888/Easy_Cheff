# Testing Guide for EasyChef

This project uses Jest for unit testing and GitHub Actions for continuous integration (CI).

## Local Testing

### Run all tests
```bash
npm test
```

### Run tests in watch mode (re-run on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## GitHub Actions Integration

Tests automatically run on:
- **Push** to `main` or `develop` branches
- **Pull requests** to `main` or `develop` branches

The workflow:
1. Checks out your code
2. Installs dependencies
3. Runs all tests with coverage
4. Uploads coverage reports to Codecov
5. Archives test results as artifacts

### View Test Results

After pushing code to GitHub:
1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select the latest workflow run
4. View test results and coverage

## Writing Tests

### Test File Location
- Create test files in `__tests__` folders within the module directory
- Or name files with `.test.ts` or `.spec.ts` suffix

### Example Test Structure
```typescript
describe('Feature Name', () => {
  test('should do something', () => {
    expect(value).toBe(expected);
  });

  test('should handle error cases', () => {
    expect(() => functionCall()).toThrow();
  });
});
```

## Test Coverage

Current coverage thresholds (from jest.config.js):
- **Statements**: 50%
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%

You can view detailed coverage reports:
```bash
npm run test:coverage
open coverage/lcov-report/index.html  # macOS/Linux
start coverage/lcov-report/index.html # Windows
```

## CI/CD Pipeline

The GitHub Actions workflow file is at: `.github/workflows/test.yml`

Tests run on:
- Node 18.x
- Node 20.x

Tests must pass before merging to `main` or `develop` branches.

## Troubleshooting

### Tests fail locally but pass on GitHub
- Ensure you're using the same Node version as GitHub Actions
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check `.github/workflows/test.yml` for the Node version matrix

### Mock Firebase errors
- Jest automatically mocks Firebase in `jest.setup.js`
- Add more mocks as needed for other external dependencies

### Coverage reports not appearing
- Ensure tests are passing first
- Check that jest config specifies `collectCoverageFrom` patterns

## Next Steps

1. Add more test files for critical features (auth, recipes, meal planner)
2. Increase coverage thresholds as test suite grows
3. Consider adding E2E tests with Detox
4. Set up branch protection rules requiring passing tests before merge
