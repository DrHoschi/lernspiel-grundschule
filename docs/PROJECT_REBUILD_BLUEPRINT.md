# Project Rebuild Blueprint

Purpose: preserve enough authority to reconstruct the project deliberately even if the current implementation is later replaced.

## 1. Product intent

"Lernspiel Grundschule" is a child-focused learning game for primary school grades 1–4, with a child learning surface and a parent oversight surface.

The intended high-level architecture is:

1. **Child app**
   - exercises
   - learning/game loop
   - rewards/progress
2. **Learning engine**
   - task generation
   - answer evaluation
   - progress/error history
   - later: adaptive difficulty and spaced repetition
3. **Backend**
   - later authority for accounts, child ownership, synchronization, reporting and privacy lifecycle
4. **Parent area**
   - statistics
   - goals
   - recommendations
   - later reports/export/privacy controls

The supplied Lastenheft files under `docs/` remain the product-requirement source. This blueprint records the audited implementation/rebuild interpretation, not a replacement for the Lastenheft.

## 2. Known prototype capabilities to preserve when rebuilding

The audited prototype already demonstrated useful concepts that should not be lost without an explicit product decision:

- hash-based SPA navigation
- child and parent surfaces
- four-symbol child PIN concept
- arithmetic exercise definitions and generated tasks
- selectable number ranges
- ten-task normal rounds
- result/progress history
- problem-task tracking
- processing-time/statistics data
- stickers/achievements/daily goals
- parent statistics/detail views
- CSV export
- hard-problem training
- SuperRun/Speedrun
- local persistence prototype
- PWA/offline shell
- prepared API abstraction

## 3. Architecture boundaries for a clean rebuild

### UI must not become data authority

UI components should render and dispatch actions. Account ownership, learning progress, task history and report state should have explicit data/service authority.

### Separate exercise definition from exercise session

An exercise definition should describe subject/grade/operator/range/rules. A session should hold generated tasks, answers, timing and completion state.

### Use one operation contract

All modes (normal play, hard-problem training, speedrun, later adaptive modes) must consume the same operation/task contract rather than each mode reimplementing arithmetic. The AUD-02 TrainHard and SuperRun defects are evidence for this requirement.

Suggested task shape:

```text
Task
- id
- exerciseId
- operator
- operands[]
- prompt
- expectedAnswer
- metadata (range, grade, difficulty, source)
```

### Parent/child ownership must be explicit

Production direction from the Lastenheft:
- parent account is the account authority
- parent creates/manages child profiles
- child selects an existing profile
- child authentication must not silently create a new child

### Persistence must be replaceable

LocalStorage is acceptable only as prototype/local mode. Keep persistence behind a store/repository interface so a backend sync layer can replace or augment it.

### PWA must be testable as a contract

At minimum verify:
- manifest exists and is valid
- icon references resolve
- app-shell assets resolve
- startup module dependency closure is cached where required
- service-worker install succeeds
- online first load works
- offline reload works after install
- cache upgrade behavior is defined

## 4. Rebuild order

### Phase R0 — Reproduce frozen prototype behavior
Recreate the `0.1.0-pre` frozen behavior with tests before adding capability.

### Phase R1 — Learning core correctness
Equivalent to the next defined audit direction:
- generator correctness
- answer correctness
- number-range invariants
- subtraction/division validity rules
- mixed-operation fidelity
- persistence/statistics regression

### Phase R2 — Real account model
- parent account
- parent→child ownership
- child profile creation by parent
- safe child profile selection/login
- remove implicit child self-registration

### Phase R3 — Learning Engine V1
- grade/topic model
- difficulty model
- immediate error reinforcement
- spaced repetition
- one shared task contract across modes

### Phase R4 — Curriculum completion
Systematically implement the Lastenheft content for grades 1–4 rather than adding disconnected exercises.

### Phase R5 — Backend and synchronization
- authentication
- database
- progress sync
- account/child authority
- resilient local/offline behavior

### Phase R6 — Parent intelligence
- meaningful recommendations
- reports
- PDF/email only after backend authority exists

### Phase R7 — Privacy/release
- deletion/export/retention
- consent/opt-in where required
- automated regression suite
- browser/device/PWA release tests

## 5. Explicitly deferred from the audited freeze

The following were not part of AUD-02 and must not be assumed to exist merely because the prototype is frozen:

- production backend
- email/password parent auth
- complete grades 1–4 curriculum
- adaptive learning
- spaced repetition
- avatar/unlock economy
- mini-games
- PDF/email weekly reports
- anonymized comparison values
- GDPR lifecycle implementation
- production-grade automated test coverage

## 6. Recovery authority order

If the project is rebuilt from scratch, use sources in this order:

1. Current approved Lastenheft under `docs/`
2. `AUDIT_CURRENT_STATUS.md`
3. `AUD-01_REQUIREMENTS_MATRIX.md`
4. This `PROJECT_REBUILD_BLUEPRINT.md`
5. Frozen `0.1.0-pre` implementation as behavioral evidence
6. Older module version comments/old repository history only as historical evidence

Where sources conflict, do not silently merge behavior. Reconcile the conflict explicitly before implementation.
