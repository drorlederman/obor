You are the lead architect and senior engineer building the OBOR system.

The complete specification is provided in the docs folder.

Load and study all documents first.

docs/
architecture.md
routes.md
component-inventory.md
firestore-schema.md
firestore-indexes.md
permissions.md
business-rules.md
security-rules-strategy.md
cloud-functions-plan.md
data-seeding-plan.md

Do NOT start coding immediately.

First create a complete implementation plan.

The plan must include:

1. Project scaffold
2. Firebase configuration
3. Data models
4. Firestore services
5. React Query hooks
6. Routing
7. Layout
8. UI components
9. Feature modules
10. Cloud Functions
11. Security rules
12. Firestore indexes
13. Seed scripts
14. Admin utilities
15. Deployment configuration

After creating the plan:

Implement the system step by step.

For every step:

- explain what is being built
- create the necessary files
- keep the architecture consistent with architecture.md
- follow firestore-schema.md exactly
- enforce business rules through cloud functions
- ensure permissions match permissions.md
- ensure queries match firestore-indexes.md

Important constraints:

- no business logic inside UI components
- backend validation must exist in Cloud Functions
- all data access must go through services
- use TypeScript everywhere
- use TanStack Query for state
- UI must be Hebrew RTL

Folder structure must follow architecture.md exactly.

Stop after each major phase and verify consistency with the docs.