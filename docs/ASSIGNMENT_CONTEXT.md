# SWE Assignment 8: Context and Working Rules for Claude

Read this whole file before doing anything. It is the standing brief for this project. Follow it in every session.

## 1. Who I am and what I actually want

I'm Dinesh, a CSE student. This is a **team project** for my Software Engineering course. My teammates built most of the codebase quickly with AI, didn't understand it, and have now stopped. I'm taking over.

**My real goal is not just to submit. It is to understand this project end to end**: requirements, architecture, code, backend flow, diagrams, so that I can:
1. finish the assignment on time, and
2. answer the professor's random viva questions clearly. There is no marking rubric. Marks are given by how well we explain things when asked.

So: **I must not be a person who says "yes" to everything Claude proposes.** If I can't explain a change in my own words, it should not go in.

## 2. The assignment (what we were told to submit)

> You need to submit the following for the problem assigned to you:
> - Software Requirements Specification (SRS) document (restrict it to **functional and non-functional requirements only**).
> - UML models: **Use case diagrams, Class diagrams**.
> - Submit on the date of examination. Late submissions are penalized.

Also expected by our team/course: a **PPT** and a **working website** (this repo). The PPT and the code must match each other. No template is given. Style is our choice. UML and testing don't need to be exhaustive, but they must exist in the project and appear in the PPT.

**Deadline: tomorrow (1 Oct 2026).** Prioritise: (1) a working, demo-able site, (2) SRS, (3) UML diagrams, (4) PPT aligned to the final code, (5) my ability to explain all of it.

## 3. Rules for how you (Claude) work with me

1. **Plan mode first.** For anything that changes files, show me a plan and wait for my approval. Never bulk-edit.
2. **Teach before you touch.** Before each change, explain in 3-6 lines: what it does, why it's needed, and how it connects to the rest of the system.
3. **Always include the backend picture.** For every frontend piece, explain the request flow: UI event, API call, route/controller, service/logic, DB/external service, response, UI update. Name the actual files and functions.
4. **Ground everything in the real code.** Cite file paths. If something is a guess, say "I'm not sure" instead of stating it as fact. My teammates' code may be wrong or half-finished. Don't assume it works. Run it.
5. **Small steps.** One task at a time, one git branch or commit per task, with a diff I can read. No unrelated refactors.
6. **Teach-back checkpoints.** After each major area (auth, data model, main features, etc.), stop and ask me 3 short questions to check my understanding. Correct me if I'm wrong. Don't move on until I get them right.
7. **Explain SWE concepts through this project.** When something maps to a Software Engineering concept (requirements types, use cases, class relationships, layered architecture, SDLC, testing levels, etc.), name the concept and show the example in our code.
8. **Keep it compact.** Direct technical explanations, no fluff. Use the latest stable practices and technologies where a choice is needed, but don't rewrite what already works.
9. **Never touch secrets.** Don't print, log, or commit `.env` values. Use `.env.example`.
10. If I say "just do it", still give me a 2-line summary of what you did and why.

## 4. Sequence of work (follow this order)

**Phase 0: Orientation (read-only, no edits except docs).**
- Read the repo. Produce `docs/STATUS.md`: tech stack, folder structure, architecture, each feature and where it lives, data model, API endpoints, data flow (frontend, backend, DB), how to run, env vars needed (names only), and what looks incomplete, broken, or fake (mock data, dead code, TODOs).
- End with your **top uncertainties** so I can verify them by running the app.
- Ask me any questions you need before proceeding.

**Phase 1: Walkthrough.** Explain the system to me in layers: big picture, then each feature, with teach-back checkpoints (rule 6). I will run the app alongside and confirm.

**Phase 2: Get it running and demo-able.** Fix only what blocks a working demo: setup, env, broken features, crashes. Add a minimal set of tests (a few meaningful ones) so testing exists in the project. Record what changed in `docs/CHANGELOG_MINE.md`.

**Phase 3: SRS.** Derive requirements **from the real system**. Functional and non-functional requirements only (no design, no testing sections). Give each a unique ID (FR-1, NFR-1...), make them testable and unambiguous, and group them by feature. Non-functional: performance, security, usability, reliability, etc. Only include what the project actually satisfies or can honestly claim.

**Phase 4: UML.** Use case diagram(s) and class diagram(s) reflecting the actual code (real classes, models, and relationships). Write them in Mermaid or PlantUML so they are editable, and export to images for the PPT and SRS. Explain each relationship to me (association, aggregation, inheritance, etc.).

**Phase 5: PPT.** I already have a draft PPT. Compare it with the final codebase, SRS, and UML. List mismatches, then update it. Slides should cover: problem, requirements (FR/NFR), UML, architecture, demo screenshots, testing, and limitations.

**Phase 6: Viva prep.** Quiz me on likely questions across requirements, design choices, code flow, backend, DB, diagrams, and "what if" questions. Grade my answers honestly and point out gaps.

## 5. First task for this session: update CLAUDE.md

The repo has a `CLAUDE.md`. **Read it first, then update it (don't replace it)**:
- Keep everything useful that's already there.
- Add a section "Project context": the assignment goal (Section 1-2 above) in 5-8 lines, and a pointer to `docs/ASSIGNMENT_CONTEXT.md`.
- Add a section "Working rules": the rules from Section 3 in condensed form.
- Add or correct: the run/build/test commands, folder structure, and key architecture notes you verify from the real code.
- Show me the diff and explain it before saving.

## 6. Definition of done

- App runs end to end with the main features working in a live demo.
- SRS and UML files exist, match the code, and are exported (PDF plus editable sources).
- PPT matches the final system.
- I can explain: what each requirement means, why each diagram looks the way it does, how a request flows from browser to database and back, and why the main design choices were made.

**Start now with Phase 0. Enter plan mode, tell me your plan for reading the repo, and ask any questions before proceeding.**
