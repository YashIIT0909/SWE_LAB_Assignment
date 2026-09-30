# Documentation index

What each file in `docs/` is, and whether it matches the code as of 30 Sep 2026.

| File | What it is | Matches the code? |
|---|---|---|
| `00-problem-statement.md` | The original problem statement (Assignment 8). | n/a |
| `01-SRS.md` | Functional (FR-1..FR-27) and non-functional (NFR-1..NFR-11) requirements. | Yes, rewritten in Phase 3. |
| `02-use-cases.md` | Use cases UC-1..UC-12 and a use case diagram (a Mermaid flowchart, not real UML). | Text mostly yes; diagram to be redone in Phase 4. |
| `03-structured-analysis.md` | Structured analysis with data flow diagrams, written before coding. | Not re-checked; not part of the required deliverables. |
| `04-design.md` | Architecture, data model, class diagram. | Class diagram has known errors, to be fixed in Phase 4. |
| `05-api.md` | Every endpoint with request and response examples, error codes, security rules. | Yes. |
| `06-test-plan.md` | Test strategy, test cases T-01..T-48, results. | Yes. |
| `07-project-plan.md` | Build phases 0 to 9 and the assignment phases 0 to 6. | Yes. |
| `08-report.md` | Final report: FR traceability matrix, test results, demo script, security notes. | Yes, except use case IDs follow `02-use-cases.md` (Phase 4). |
| `ASSIGNMENT_CONTEXT.md` | The assignment brief and working rules for this project. | n/a |
| `STATUS.md` | Phase 0 findings: how the system works, what was checked, problems found. Section 12 marks which problems are fixed. | Snapshot from Phase 0; see section 12 for what changed. |
| `CHANGELOG_MINE.md` | My changes since taking over, with reasons. | Yes. |
| `PROGRESS.md` | One row per build phase and assignment phase. | Yes. |

The authoritative summary of the code (data model, counter rules, API table, commands) is
`CLAUDE.md` in the repository root.

## Still to do

- Phase 4: redo the use case diagram in real UML notation and correct the class diagram, then
  update `02-use-cases.md`, `04-design.md` and the use case columns of `08-report.md`.
- Phase 5: bring the PPT in line with the SRS, UML and code (the PPT is outside the repo).
