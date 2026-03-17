# AGENTS.md

## Mission
Implement features end-to-end with minimal interruptions.
Work continuously until the requested task is completed, validated, or truly blocked.

## Default behavior
1. First, write a short implementation plan with 4-7 concrete steps.
2. Then execute the plan step by step without stopping after analysis.
3. Work in small batches:
   - prefer changing up to 3 files at a time
   - avoid large repo-wide rewrites unless required
4. After each meaningful batch, validate the changes.
5. If validation fails, fix the issue immediately and continue.
6. Only stop when:
   - the task is complete, or
   - there is a real blocker (missing requirement, broken environment, missing secret, failing dependency install, etc.)

## Completion criteria
A task is complete only when all of the following are true:
- the feature or fix is implemented end-to-end
- changed code is consistent with existing project patterns
- TypeScript passes
- lint passes
- relevant tests pass, if tests exist
- any required imports, routes, hooks, types, and Firebase bindings are updated
- brief summary of changed files and remaining risks is provided

## Hard rules
- Do not stop after only explaining the problem.
- Do not stop after only creating a plan.
- Do not ask unnecessary questions when the intent can be inferred from the codebase.
- When requirements are slightly ambiguous, choose the safest implementation that matches existing patterns.
- Ask a question only if a product decision cannot be inferred and blocks implementation.
- Prefer finishing a partial but working implementation over stopping early.

## Repo navigation rules
- Do not scan the entire repository unless necessary.
- First inspect only the files directly related to the task.
- Expand outward only when needed to understand data flow, routing, shared types, auth, or Firebase integration.
- Prefer targeted searches over broad recursive scans.

## Editing strategy
- Prefer editing existing files over creating new abstractions.
- Reuse existing hooks, services, components, utilities, and Firebase patterns before adding new ones.
- Keep changes local and incremental.
- Avoid unnecessary renames or broad refactors during feature work.
- Do not introduce new dependencies unless clearly needed.

## Frontend rules
- Respect the existing framework and folder structure.
- Reuse existing UI patterns, layout wrappers, page structure, and state management.
- Keep components focused and reasonably small.
- Prefer existing hooks/services over inline data-fetching logic.
- Preserve current routing conventions.
- Update loading, empty, and error states when relevant.
- If a page uses placeholder/stub data, replace it with real data flow only when required by the task.

## Firebase / backend rules
- Reuse existing Firebase initialization and exported functions.
- Check for existing callable functions, triggers, Firestore access helpers, and shared schemas before adding new backend logic.
- Keep security and auth assumptions aligned with existing project patterns.
- If changing Firestore-related data flow, update relevant types, mappers, and calling code together.
- If a backend change affects the frontend contract, update both sides in the same task.

## Shared types and contracts
- Keep frontend, backend, and shared types in sync.
- Avoid `any`.
- Prefer explicit interfaces/types.
- When changing a response shape or document model, update all impacted call sites.

## Validation workflow
After each meaningful batch, run the simplest relevant validation commands.

### Preferred project scripts
Use project scripts instead of ad-hoc shell one-liners.

For frontend:
- `npm run lint`
- `npm run typecheck`
- `npm test -- --runInBand`

For Firebase/functions:
- use the existing project scripts if present
- if no dedicated scripts exist, inspect package scripts first before improvising

### Validation priority
1. run the narrowest relevant check first
2. fix failures immediately
3. continue automatically once checks pass

## Windows / shell safety rules
This project may run on Windows paths and shell behavior may be fragile.

- Avoid complex chained shell commands.
- Avoid fragile `grep | head | echo` style pipelines.
- Prefer reading files directly and using simple commands.
- Prefer project scripts over custom shell logic.
- If searching is needed, use simple targeted searches.
- Do not rely on shell-specific behavior that may break on Windows.

## When blocked
A blocker must be stated explicitly.

When blocked, provide:
1. exact blocker
2. what was completed
3. next best action
4. precise file, command, or requirement needed to continue

Do not say “done” when blocked.

## Output format during work
At the start:
- short plan

During work:
- continue execution without waiting for confirmation after each step
- only mention validation failures or real blockers

At the end:
- what was implemented
- files changed
- validations run
- remaining risks or follow-ups

## Task execution template
For every task, follow this pattern:

1. Understand the request from the prompt and nearby code.
2. Inspect only the most relevant files first.
3. Create a short plan.
4. Implement step 1.
5. Validate.
6. Fix issues.
7. Implement next step.
8. Validate again.
9. Continue until completion criteria are met.

## Feature implementation mode
When asked to build a feature:
- implement end-to-end, not just UI
- connect UI, data flow, types, backend calls, and validation as needed
- update related routes, services, and hooks when required
- do not leave obvious stubs unless the task explicitly asks for scaffolding

## Bug fix mode
When asked to fix a bug:
- identify the failing path
- implement the smallest robust fix
- validate the fix
- check for nearby regressions in related code paths

## Refactor mode
When asked to refactor:
- preserve behavior unless the task explicitly requests behavior changes
- keep scope controlled
- run validation after each meaningful refactor batch

## Definition of success
Success means the agent continued autonomously through planning, implementation, and validation with minimal interruption and without unnecessary broad scanning.