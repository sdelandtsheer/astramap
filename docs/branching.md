# Branching Workflow

Rubin Night Watch uses short-lived milestone branches with `main` as the integrated branch.

## Branch Types

- `main`: integrated, pushed branch. Milestones are merged here after their exit criteria pass.
- `milestone/NN-short-name`: one branch per milestone, for example `milestone/01-repository-skeleton`.
- `fix/short-name`: narrow corrective branches when needed after a milestone merge.

## Commit Practice

- Make small commits when a milestone has separable pieces.
- Use imperative commit messages, for example `Add repository skeleton`.
- Keep generated data, build output, and dependency folders out of Git unless a milestone explicitly requires committed demo assets.

## Milestone Flow

1. Start from an up-to-date `main`.
2. Create `milestone/NN-short-name`.
3. Implement only the current milestone's scope.
4. Run the relevant checks for that milestone.
5. Commit and push the milestone branch.
6. Merge back to `main` with a merge commit.
7. Push `main`.

This keeps the history reviewable while preserving milestone boundaries.
