# UML diagrams

PlantUML sources (`*.puml`) and exported images (`*.png` for slides, `*.svg` for zooming) of the
diagrams used in `docs/02-use-cases.md` and `docs/04-design.md`.

| Diagram | Source | Shows |
|---|---|---|
| Use case diagram | `use-case.puml` | Actors, use cases UC-1 to UC-14, generalization and extend relationships |
| Domain class diagram | `class-domain.puml` | The 10 entities of `apps/api/prisma/schema.prisma` and how they relate |
| Backend class diagram | `class-backend.puml` | Routes, middleware, controllers, services and their dependencies in `apps/api/src` |

## Regenerate the images

Needs Java and the PlantUML jar (https://plantuml.com/download). Graphviz is not required, because the
class diagrams use PlantUML's built-in `smetana` layout.

```
java -jar plantuml.jar -tpng -charset UTF-8 docs/diagrams/*.puml
java -jar plantuml.jar -tsvg -charset UTF-8 docs/diagrams/*.puml
```

Change the `.puml` file, regenerate both formats and commit all three files together.
