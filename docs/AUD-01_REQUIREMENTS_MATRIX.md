# AUD-01 Requirements Reconciliation Matrix

This file preserves the requirements-level result of the 2026-08-30/31 project audit against the supplied Lastenheft. Status describes the audited PRE-MVP state.

| ID | Requirement | Audited state | Status |
|---|---|---|---|
| A01 | Parent account email/password | API concept prepared; actual login local by code | MISSING |
| A02 | Multiple children per parent | Local child data possible; no real parent→child management | PARTIAL |
| A03 | Child login image PIN | Four symbols present | PRESENT |
| A04 | “Who is at the device?” profile selection | Name entered manually | PARTIAL |
| A05 | Parents create child profiles | Unknown child could be auto-created at login | DEVIATION |
| L01 | Grade 1 mathematics | Addition/subtraction present | PARTIAL |
| L02 | Grade 2 mathematics | Multiplication tables/basic arithmetic present | PARTIAL |
| L03 | Grade 3 mathematics | Mostly general basic arithmetic only | MOSTLY MISSING |
| L04 | Grade 4 mathematics | Not implemented | MISSING |
| L05 | Parametric task generation | Present | PRESENT |
| L06 | Number ranges | 10 / 100 / 1,000 / 1,000,000 selectable | PRESENT |
| U01 | Standard 10-task round | Present | PRESENT |
| U02 | Correct → harder | Not implemented | MISSING |
| U03 | Wrong → easier | Not implemented | MISSING |
| U04 | Immediate error repetition | Special training exists, not normal-round adaptation | PARTIAL |
| U05 | Spaced repetition | Not implemented | MISSING |
| R01 | Points/stars | Medals/stickers exist; no unified point system | PARTIAL |
| R02 | Streak/series bonus | Achievement/progress logic exists | PARTIAL |
| R03 | Sticker album | Stickers collected/displayed | PRESENT |
| R04 | Avatar/unlocks | Not implemented | MISSING |
| R05 | Mini-games | Not implemented | MISSING |
| R06 | Weekly streak/medals | Daily-goal streak; milestone after 3 days | PARTIAL |
| P01 | Parent dashboard | Present | PRESENT |
| P02 | Correct/wrong/rate | Present | PRESENT |
| P03 | Processing time | Present | PRESENT |
| P04 | Topic overview | Present per exercise | PRESENT |
| P05 | Error analysis | Problem list/error rate/time present | PRESENT |
| P06 | Concrete learning recommendations | Not substantively implemented | MISSING |
| P07 | Comparison values | Not implemented | MISSING |
| P08 | CSV export | Two CSV exports present | PRESENT |
| P09 | PDF export | Not implemented | MISSING |
| P10 | Weekly email report | Not implemented | MISSING |
| D01 | GDPR deletion right | No account/learning-data deletion workflow | MISSING |
| D02 | Full data export | Statistics CSV only | PARTIAL |
| D03 | 24-month deletion logic | Not implemented | MISSING |
| D04 | Anonymous comparison/opt-in | Not implemented | MISSING |
| T01 | PWA | Skeleton present; defects existed before AUD-02 | DEFECTIVE AT AUD-01 |
| T02 | Offline | Service worker existed; install/precache defective before AUD-02 | BLOCKED AT AUD-01 |
| T03 | Responsive UI | Responsive CSS present | PRESENT |
| T04 | Parent PIN | Present as prototype | PRESENT/PROTOTYPE |
| T05 | Read-aloud | Not implemented | MISSING |
| T06 | Optional fonts | Not implemented | MISSING |
| B01 | Production backend | Not implemented | MISSING |
| B02 | API abstraction | Prepared | PRESENT |
| Q01 | Automated tests | None in audited test area | MISSING |

## Interpretation

The audit classified the code as a **functional PRE-MVP prototype**, not a finished V2 product. The approximate 50–55% figure used in the chat refers to Lastenheft/MVP coverage only.

The matrix is historical evidence for the PRE-MVP reference. AUD-02 subsequently repaired PWA infrastructure, duplicate routing, product-version consistency and two existing exercise-fidelity bugs; it did not close the missing product capabilities above.
