# Git Commit Message Generation Rules

When generating commit messages, you MUST strictly follow the Conventional Commits specification. Analyze the staged changes carefully and choose the most appropriate type.

- **feat:** A new feature, functionality, or significant structural addition.
- **fix:** A bug fix, error resolution, or layout correction.
- **style:** Visual changes, UI/UX updates, CSS tweaks, animations, or code formatting (spaces, semicolons) that do not affect the core logic.
- **perf:** Code changes that improve performance (e.g., adding React.memo, optimizing rendering, fixing lag).
- **refactor:** Code changes that neither fix a bug nor add a feature, but improve code structure or logic.
- **docs:** Documentation changes (README, comments).
- **test:** Adding missing tests or correcting existing tests.
- **chore:** Strictly reserve this for updating build tasks, package manager configs (npm/yarn), or minor dependency bumps.
