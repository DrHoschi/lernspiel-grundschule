# AUD-04A-I1 Authority / Session Core Implementation
Status: **IMPLEMENTED / PREVIOUS CHAT REGRESSION PASS / NOT YET FROZEN**.
Implemented scope: stable `parentId` in Parent session; stable `childId` + owning `parentId` in Child session; no Child auto-create during login; Parent-PIN as separate adult-area guard; local child projection is cache, not ownership authority; Child creation requires Parent session; API authority when configured and explicit development authority when API is disabled.
Files in I1 authority scope: `src/auth/auth.js`, `src/lib/api.js`, `src/ui/LoginForm.js`, minimal `src/app.js`. Regression test: `tests/auth-session-core-regression.mjs`.
Explicitly not I1: stable child-ID plumbing through progress/rewards/goals (I2), and Name→childId data migration.
Next gate after repository backfill: **AUD-04A-I1 Completion / Scope / Regression Gate**.