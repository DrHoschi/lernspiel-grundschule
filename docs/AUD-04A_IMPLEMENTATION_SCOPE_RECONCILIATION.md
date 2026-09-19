# AUD-04A Implementation Scope Reconciliation
Status: **PASS / SCOPE DEFINED / 0 BLOCKER / NOT IMPLEMENTED**.
Authority Core: `src/auth/auth.js`, `src/lib/api.js`, `src/ui/LoginForm.js`, minimal `src/app.js`.
Identity-consumer/adapter zone for later I2: exercises, achievements, goals, ExercisePlay, child dashboards/books/poster/TrainHard and parent dashboard/statistics because current stores use child display names as keys.
Required boundaries: Parent identity projection, Child identity projection, explicit Parent/Child session contract, authorized child device projection/cache, Parent-area guard.
Name→childId migration is a separate controlled gate; no silent migration, guessing on duplicate names or deletion of old data.
Preserve learning generators, answer checking, 10-task rounds, completion event, rewards/goals, statistics formulas, TrainHard/SuperRun fidelity, PWA shell and version `0.1.0-pre`.