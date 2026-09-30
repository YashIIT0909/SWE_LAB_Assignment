# UML diagrams

PlantUML sources (`*.puml`) and exported images (`*.png` for slides, `*.svg` for zooming) of the
diagrams used in `docs/02-use-cases.md` and `docs/04-design.md`.

| Diagram | Source | Shows |
|---|---|---|
| Use case diagram | `use-case.puml` | Actors, use cases UC-1 to UC-14, generalization and extend relationships |
| Domain class diagram | `class-domain.puml` | The 10 entities of `apps/api/prisma/schema.prisma` and how they relate |
| Backend class diagram | `class-backend.puml` | Routes, middleware, controllers, services and their dependencies in `apps/api/src` |
| Sequence: add a component | `seq-add.puml` | UC-2 and UC-5: create with keywords in one transaction |
| Sequence: search | `seq-search.puml` | UC-6: validate, score, save the query and the hit counters |
| Sequence: use | `seq-use.puml` | UC-7: mark used and update the counters |
| Data flow, level 0 | `dfd-level0.puml` | Context diagram, from `docs/03-structured-analysis.md` |
| Data flow, level 1 | `dfd-level1.puml` | 7 processes and 8 data stores, from `docs/03-structured-analysis.md` |

All diagrams include `sccs-theme.puml`, which holds the shared colours (deep teal, teal, mist, amber),
the font (Calibri) and a white background. Change the look there and regenerate everything.

## Regenerate the images

Needs Java, the PlantUML jar (https://plantuml.com/download) and Graphviz (`dot`), which PlantUML uses
to lay out the diagrams. If `dot` is not on the PATH, set `GRAPHVIZ_DOT` to its full path first, for
example `C:/Program Files/Graphviz/bin/dot.exe`.

```
java -jar plantuml.jar -tpng -charset UTF-8 docs/diagrams/*.puml
java -jar plantuml.jar -tsvg -charset UTF-8 docs/diagrams/*.puml
```

Change the `.puml` file, regenerate both formats and commit all three files together.
