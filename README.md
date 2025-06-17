 # MRPAF Pixel Art Editor

 This repository contains the reference implementation of a Multi-Resolution Pixel Art Editor, compliant with MRPAF v2.0.1.
 The project is structured as a monorepo with the following packages:

 - **packages/core**: MRPAF type definitions, JSON Schema validation, and IO.
 - **packages/renderer**: Canvas/WebGL composition engine.
 - **packages/editor**: React-based UI components.

 ## Design Documents

 The detailed design specifications are located in the `docs/` directory:

 - `docs/mrpafエディタ設計書.md`: Editor design specification (Japanese).
 - `docs/Multi-Resolution Pixel Art Format (MRPAF) Specification v2.0.1.md`: Format specification (Markdown).

 ## Development Process

 This project adopts an AI-driven development workflow. The key practices are:

 1. **Context Retention**
    - The AI agent continuously updates this README to preserve the current development context and next steps.
    - All design decisions, progress, and pending tasks are documented here.

 2. **Feature Branch Workflow**
    - Every new feature or task is implemented in a dedicated branch created from `main`.
    - Branch naming convention: `feature/<short-description>`.
    - After implementation and review, feature branches are merged back into `main`.

 3. **Continuous Integration (Future)**
    - Pre-commit checks, unit tests, and CI pipelines will run on pull requests to ensure code quality.

 4. **Contributions**
    - While primary development is performed by the AI agent, human contributors are welcome to submit pull requests following the branching and commit conventions.

 ## MVP

 The initial MVP provides a minimal, working pixel art editor with basic functionality:
1. Canvas with configurable resolution (default 16×16).
2. Pen and eraser tools to toggle pixels, with color palette selection.
3. Clear canvas.
4. Export project as MRPAF JSON file.
5. Import MRPAF JSON (読み込み) 機能.
6. Multi-layer support with Add/Remove layer controls, layer renaming, visibility toggling, opacity adjustments, and layer reordering.

 To run the MVP:
 - Serve the repository root over a simple HTTP server (e.g., `python3 -m http.server`).
 - Open `packages/editor/index.html` in your browser.

 Future MVP iterations will add additional functionality:
- 
 - Basic file IO (open/save projects on disk)
 - Color picker and bucket fill tools
 - Undo/redo support
 - Zoom and pan

 ---

 *Generated and maintained by the AI agent during development to ensure context continuity.*