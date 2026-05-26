# Maintainer Response Templates

Canned, copy-paste responses for recurring situations. Keep the tone firm,
professional, and unambiguous. Do not negotiate the engineering standards.

---

## Paid bounties

> Thank you for your interest in ChessVision.
>
> ChessVision is a purely open-source project. We do not run a bounty program,
> we have no budget for paid contributions, and we are not able to offer
> payment for issues, pull requests, or feature work of any kind. Contributions
> are welcome strictly on a voluntary, open-source basis.
>
> If you would like to contribute, please read
> [CONTRIBUTING.md](../CONTRIBUTING.md) first — all contributions must meet our
> engineering standards (atomic commits, Conventional Commits, zero-warning
> lint, and passing tests) to be considered.

---

## Offers of paid services / "I can build this for you"

> Thank you for reaching out.
>
> ChessVision is an open-source project maintained on a volunteer basis. We are
> not hiring, not contracting, and not purchasing development, design, audit, or
> marketing services. Unsolicited service offers will be closed without further
> response.
>
> If your intent is to contribute to the project itself, you are welcome to do
> so under our open-source contribution process — see
> [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Contributions that bypass engineering standards

> Thanks for the pull request.
>
> This contribution does not meet our engineering standards and cannot be merged
> as-is. ChessVision enforces these requirements without exception:
>
> - **Atomic commits** — one logical change per commit.
> - **Conventional Commits** — valid `<type>(scope): subject` PR title and
>   commit messages.
> - **Zero-warning quality gates** — `pnpm lint` (0 warnings),
>   `npx tsc --noEmit` (0 errors), and `pnpm test` must all pass.
> - **Tests** — behavioral changes must include or update tests.
>
> Our CI pipeline blocks non-conforming commits and PRs automatically; this is
> not a manual gate we can waive. Please update the PR to satisfy the checks in
> [CONTRIBUTING.md](../CONTRIBUTING.md) and the automated review will re-run.
> We're happy to help you get it across the line, but we cannot lower the bar.

---

## Low-effort / AI-generated spam PRs

> Thank you for the submission.
>
> This PR does not appear to address a tracked issue or provide a clear, scoped
> improvement, and it does not meet the requirements in
> [CONTRIBUTING.md](../CONTRIBUTING.md). We're closing it to keep the queue
> focused. If you believe this was closed in error, please open an issue first
> describing the problem you intend to solve, and we'll discuss the approach
> before any code is written.
