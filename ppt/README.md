# ppt: package for rebuilding the presentation

Everything needed to produce the corrected presentation. Give this whole folder (or its zip) to the
assistant that will edit the deck, and tell it to follow `PPT_Modify.md`.

| Item                                         | What it is                                                                                                                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PPT_Modify.md`                              | The instructions: facts, what is wrong in the old deck, the new 16 + 4 slide plan, design, exact text of each slide, where each image goes.                                                    |
| `Software_Component_Cataloguing_System.pptx` | The old 11-slide deck, for reference only.                                                                                                                                                     |
| `context/`                                   | Read-only copies of the project documents (SRS, use cases, design, test plan, report, problem statement, `CLAUDE.md`). Images they reference are not copied here; the images are in `images/`. |
| `images/diagrams/`                           | 8 UML, sequence and data flow diagrams as PNG and SVG, in the new colour palette.                                                                                                              |
| `images/screenshots/`                        | 7 screenshots of the running website (local demo data).                                                                                                                                        |
| `images/ai-generated/`                       | For the illustrations you make yourself (see the README inside). Optional.                                                                                                                     |

**Sources.** This folder is a bundle. The originals are in `docs/` (documents) and `docs/diagrams/`
(diagram sources in PlantUML; regenerate with the steps in `docs/diagrams/README.md`). If a document
changes, copy it here again.

**Ask for as output:** `Software_Component_Cataloguing_System_v2.pptx`.
