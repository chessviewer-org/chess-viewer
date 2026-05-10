# Contributing to ChessVision

Contributions of any kind are welcome: bug reports, feature requests, documentation improvements, and code changes.

---

## Ways to Contribute

- Report bugs
- Suggest features
- Improve or add code (bug fixes, refactors, optimizations)
- Improve documentation
- Review pull requests

---

## Reporting Bugs

Before opening an issue:

1. Search existing issues to avoid duplicates.
2. Reproduce the bug on the latest version.
3. Open a new issue and include:
   - Clear description of the problem
   - Steps to reproduce
   - Expected behavior vs. actual behavior
   - Screenshots or screen recordings if applicable
   - Environment: browser name and version, OS

Submit at: https://github.com/BilgeGates/chess-vision/issues

---

## Feature Requests

When submitting a feature request, include:

- Description of the proposed feature
- Use case — why it's useful
- Expected behavior
- Mockups or examples (optional)

---

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- Git

### Installation

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/chess-vision.git
cd chess-vision
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:3000`.

### Build

```bash
pnpm build    # production build → dist/
pnpm preview  # serve dist/ locally
```

---

## Making Changes

### Branching

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Coding Standards

- All exported functions use `export function` declarations (no arrow function exports).
- All exported functions and components have JSDoc with `@param` and `@returns`.
- Memo components: `const X = memo(function X({ props }) { ... })`.
- Import order: React/framework → third-party → `@/` paths → relative paths.
- No unnecessary inline comments; keep logic readable without them.
- Keep functions small and single-purpose.

### Commit Messages

Prefix commits with a type:

| Prefix      | Use case                               |
| ----------- | -------------------------------------- |
| `Add:`      | New feature or file                    |
| `Fix:`      | Bug fix                                |
| `Update:`   | Modification to existing functionality |
| `Refactor:` | Code cleanup without behavior change   |
| `Docs:`     | Documentation only                     |

Example:

```
Add: board flip functionality
Fix: piece drag-and-drop on mobile
Refactor: split canvasExporter into smaller functions
```

---

## Submitting a Pull Request

1. Push your branch to your fork.
2. Open a pull request against the `main` branch.
3. In the PR description, include:
   - What changed and why
   - Related issue references (e.g. `Fixes #123`)
   - Screenshots for UI changes
4. Address review feedback and push updates to the same branch.

### Pre-submission Checklist

- [ ] Code follows project standards (function declarations, JSDoc)
- [ ] No console errors or warnings
- [ ] Changes tested locally across relevant scenarios
- [ ] Documentation updated if behavior changed
- [ ] Commit messages follow the prefix convention
- [ ] Branch is up to date with `main`

---

## Documentation

Contributing to documentation is as valuable as code contributions:

- Improve clarity in README or docs/
- Add JSDoc where missing
- Fix typos or outdated information
- Document architectural decisions in docs/DECISIONS.md

---

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Contact

- GitHub Issues: https://github.com/BilgeGates/chess-vision/issues
- Repository: https://github.com/BilgeGates/chess-vision
