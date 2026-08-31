# Mandatory User Approval Gate for Git Operations

## Strict Protocol:
1. **Never Automate Git Commits/Pushes**: AI agents and subagents must NEVER execute `git commit` or `git push` autonomously or silently without explicit, recorded user consent.
2. **Prerequisites for Prompting User**:
   - Build validation must pass with 0 errors (`pnpm run build`).
   - Automated tests or browser verification scripts must pass 100%.
   - High-resolution visual proof / walkthrough must be presented.
   - If schema changed, DBA review must be completed.
3. **Prompt Format**:
   - Present the exact proposed commit message formatted with Conventional Commits (e.g. `feat(scope): short description`).
   - Ask the user directly: *"Shall I proceed with committing and pushing to main?"*
   - Wait for explicit affirmative confirmation before calling git tools.
