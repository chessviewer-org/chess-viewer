# Code Quality Tools Setup Guide

Setup guide for ESLint, Prettier, Husky, and Commitlint.

**Note:** These tools are documented but may not be fully configured in the project.

---

## Installation

### Step 1: Install Dependencies

```bash
# Install ESLint and plugins
npm install --save-dev eslint \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-react-refresh

# Install Prettier
npm install --save-dev prettier

# Install Husky and lint-staged
npm install --save-dev husky lint-staged

# Install Commitlint
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Step 2: Create Configuration Files

Create these files in your project root:

1. `.eslintrc.json` - ESLint configuration
2. `.prettierrc` - Prettier configuration
3. `.prettierignore` - Files to ignore for Prettier
4. `.commitlintrc.json` - Commitlint configuration
5. `.lintstagedrc.json` - Lint-staged configuration

### Step 3: Initialize Husky

```bash
# Initialize Husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Create commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Step 4: Update package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,json,css,md}\"",
    "format:check": "prettier . --check",
    "prepare": "husky install"
  }
}
```

---

## Usage

### ESLint

```bash
# Check for linting errors
pnpm lint

# Fix linting errors automatically
pnpm lint:fix

# Lint specific file
pnpm eslint src/App.tsx

# Lint and fix specific file
pnpm eslint src/App.tsx --fix
```

### Prettier

```bash
# Format all files
pnpm format

# Check formatting without changing files
pnpm format:check

# Format specific file
pnpm prettier --write src/App.tsx

# Format specific folder
pnpm prettier --write "src/components/**/*.jsx"
```

### Husky (Automatic)

Husky runs automatically on git hooks:

**Pre-commit Hook:**

- Runs `lint-staged` on staged files
- Fixes ESLint errors
- Formats code with Prettier
- Blocks commit if errors remain

**Commit-msg Hook:**

- Validates commit message format
- Ensures Conventional Commits format
- Blocks commit if message is invalid

### Manual Testing

```bash
# Test pre-commit hook manually
npm run lint:fix
npm run format

# Test commit message format
echo "feat: add new feature" | npx commitlint
echo "invalid message" | npx commitlint
```

---

## Commit Message Format

### Conventional Commits

Format: `<type>(<scope>): <subject>`

**Types:**

| Type       | Description             | Example                               |
| ---------- | ----------------------- | ------------------------------------- |
| `feat`     | New feature             | `feat: add SVG export`                |
| `fix`      | Bug fix                 | `fix: resolve Safari rendering issue` |
| `docs`     | Documentation           | `docs: update README`                 |
| `style`    | Code style (formatting) | `style: format with prettier`         |
| `refactor` | Code refactoring        | `refactor: simplify FEN parser`       |
| `perf`     | Performance improvement | `perf: optimize canvas rendering`     |
| `test`     | Tests                   | `test: add unit tests for parser`     |
| `chore`    | Maintenance             | `chore: update dependencies`          |
| `ci`       | CI/CD changes           | `ci: add GitHub Actions workflow`     |
| `build`    | Build system            | `build: update vite config`           |
| `revert`   | Revert previous commit  | `revert: undo feature X`              |

**Valid Examples:**

```bash
feat: add dark mode support
feat(export): implement batch export
fix: correct piece alignment on small screens
fix(fen): handle invalid FEN notation gracefully
docs: add contribution guidelines
docs(api): document export functions
style: apply prettier formatting
refactor(board): simplify state management
perf: reduce bundle size by 20%
test: add integration tests for export
chore: update React to v19
ci: add automated testing workflow
```

**Invalid Examples:**

```bash
❌ Added new feature          # Missing type
❌ FEAT: add dark mode        # Type must be lowercase
❌ feat:add dark mode         # Missing space after colon
❌ feat: Add dark mode.       # Subject should not end with period
❌ feat: Added dark mode      # Subject should be imperative mood
```

---

## Configuration Details

### ESLint Rules

**Enabled Rules:**

- React Hooks validation
- Unused variables warning
- Console statement warnings
- Prefer const over let
- No var keyword
- Semicolon enforcement
- Single quotes preference

**Disabled Rules:**

- React in JSX scope (not needed in React 17+)
- React prop-types (warnings only)

### Prettier Settings

**Configuration:**

- Print width: 80 characters
- Tab width: 2 spaces
- Use spaces (not tabs)
- Semicolons: required
- Single quotes: yes
- Trailing commas: none
- Bracket spacing: yes
- Arrow function parentheses: always

### Lint-staged Behavior

**On commit, automatically:**

1. Run ESLint on `.js` and `.jsx` files
2. Fix auto-fixable ESLint errors
3. Format files with Prettier
4. Stage fixed files
5. Block commit if errors remain

**Files Checked:**

- `*.{js,jsx}` - ESLint + Prettier
- `*.{json,md,css,scss}` - Prettier only
- `*.{png,jpg,jpeg,gif,svg}` - Validation only

---

## VS Code Integration

### Recommended Extensions

```json
{
  "recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact"],
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Ignoring Files

### .eslintignore

Create `.eslintignore`:

```
node_modules
dist
build
coverage
*.config.js
```

### .prettierignore

Already created - see artifact.

---

## Troubleshooting

### Husky Hooks Not Running

```bash
# Reinstall Husky
rm -rf .husky
npm run prepare

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### ESLint Errors

```bash
# Clear cache
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Prettier Conflicts with ESLint

```bash
# Install eslint-config-prettier to disable conflicting rules
npm install --save-dev eslint-config-prettier

# Add to .eslintrc.json extends
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"  // Must be last
  ]
}
```

### Pre-commit Hook Fails

```bash
# Run manually to see errors
npx lint-staged

# Fix errors manually
npm run lint:fix
npm run format

# Commit again
git commit -m "your message"
```

### Commit Message Validation Fails

```bash
# Test your commit message
echo "your commit message" | npx commitlint

# Use correct format
git commit -m "feat: your feature description"
```

---

## Best Practices

### 1. Always Format Before Commit

```bash
npm run format
git add .
git commit -m "style: format code"
```

### 2. Fix Linting Errors Regularly

```bash
npm run lint:fix
```

### 3. Write Clear Commit Messages

```bash
# Good
git commit -m "feat(export): add PNG quality selection"

# Better
git commit -m "feat(export): add PNG quality selection

Adds quality dropdown in export modal allowing users to choose
between Low, Medium, High, and Ultra quality settings."
```

### 4. Use Scope When Relevant

```bash
git commit -m "feat(board): add flip animation"
git commit -m "fix(fen): validate rank counts"
git commit -m "docs(api): document export functions"
```

### 5. Keep Commits Focused

```bash
# Instead of:
git commit -m "feat: add multiple features"

# Do:
git commit -m "feat: add SVG export"
git commit -m "feat: add batch export"
git commit -m "docs: update export documentation"
```

---

## Quick Reference

### Common Commands

```bash
# Check code quality
npm run lint
npm run format:check

# Fix issues
npm run lint:fix
npm run format

# Manual commit hooks
npx lint-staged
npx commitlint --edit <file>

# Skip hooks (not recommended)
git commit --no-verify -m "message"
```

### Commit Types Quick Reference

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code style
refactor: Refactoring
perf:     Performance
test:     Tests
chore:    Maintenance
ci:       CI/CD
build:    Build
revert:   Revert
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/lint.yml`:

```yaml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Check Prettier formatting
        run: pnpm format:check
```

---

**Last Updated:** May 6, 2026  
**Maintainer:** [@BilgeGates](https://github.com/BilgeGates)
