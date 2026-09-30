# Documentation index

What each file in `docs/` is, and whether it matches the code as of 30 Sep 2026.

| File | What it is | Matches the code? |
|---|---|---|
| `00-problem-statement.md` | The original problem statement (Assignment 8). | n/a |
| `01-SRS.md` | Functional (FR-1..FR-27) and non-functional (NFR-1..NFR-11) requirements. | Yes, rewritten in Phase 3. |
| `02-use-cases.md` | Use cases UC-1..UC-14, each with flows, and the use case diagram. | Yes, redone in Phase 4. |
| `diagrams/` | PlantUML sources and PNG/SVG images: use case, two class diagrams, three sequence diagrams, two data flow diagrams. See `diagrams/README.md`. | Yes, Phases 4 and 5. |
| `../ppt/` | Package for rebuilding the presentation: instructions (`PPT_Modify.md`), the old deck, copies of these documents, diagrams and screenshots. See `../ppt/README.md`. | Yes, Phase 5. |
| `03-structured-analysis.md` | Structured analysis: context and level 1 data flow diagrams and a data dictionary, written before coding. | The level 1 flows were read against the code and are consistent; the data dictionary was not re-checked. Not a required deliverable. |
| `04-design.md` | Architecture, layers, ER diagram, class diagrams, sequence, state and activity diagrams. | Layers, class diagrams and sequence diagrams checked and corrected in Phase 4. The ER, state and activity diagrams were not re-checked. |
| `05-api.md` | Every endpoint with request and response examples, error codes, security rules. | Yes. |
| `06-test-plan.md` | Test strategy, test cases T-01..T-48, results. | Yes. |
| `07-project-plan.md` | Build phases 0 to 9 and the assignment phases 0 to 6. | Yes. |
| `08-report.md` | Final report: FR traceability matrix, test results, demo script, security notes. | Yes. |
| `ASSIGNMENT_CONTEXT.md` | The assignment brief and working rules for this project. | n/a |
| `STATUS.md` | Phase 0 findings: how the system works, what was checked, problems found. Section 12 marks which problems are fixed. | Snapshot from Phase 0; see section 12 for what changed. |
| `CHANGELOG_MINE.md` | My changes since taking over, with reasons. | Yes. |
| `PROGRESS.md` | One row per build phase and assignment phase. | Yes. |

The authoritative summary of the code (data model, counter rules, API table, commands) is
`CLAUDE.md` in the repository root.

## Still to do

- Phase 5: give the `ppt/` folder to the assistant that edits the deck, check the result against `ppt/PPT_Modify.md`, and add the optional illustrations to `ppt/images/ai-generated/`.
