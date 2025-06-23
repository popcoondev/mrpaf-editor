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
6. Multi-layer support with add/remove layer controls, layer renaming, visibility toggling, opacity adjustments, and layer reordering.
7. Color picker tool to pick existing colors from the canvas.
8. Bucket fill tool to flood fill contiguous regions.
9. Basic file IO: save/load projects in local storage.
10. Zoom and pan support: canvas zoom controls and pan tool.
11. Palette editor: add/remove and rename palette colors via UI.
12. Brush size control for pen and eraser tools.
13. Line drawing tool.

 To run the MVP:
 - Serve the repository root over a simple HTTP server (e.g., `python3 -m http.server`).
 - Open `packages/editor/index.html` in your browser.


 ---

 ## Progress

 **Implemented MVP features:**
 - [x] Canvas with default resolution (16×16)
 - [x] Pen and eraser tools, color palette selection
 - [x] Clear canvas
 - [x] Export project as MRPAF JSON
 - [x] Import MRPAF JSON
 - [x] Multi-layer support (add/remove, rename, visibility, opacity, reorder)
 - [x] Color picker tool
 - [x] Bucket fill tool
 - [x] Basic file IO: Save/Load in local storage
 - [x] Zoom and pan support
 - [x] Palette editor (add/remove, rename)
- [x] Brush size control
- [x] Configurable canvas resolution
  - [x] Line drawing tool
  - [x] Background image layer support

**Remaining MRPAF v2.0.1 compliance features**
The following areas are not yet fully implemented. Each should be developed in its own `feature/mrpaf-XXX` branch.

- Layers
  - [ ] Support layer hierarchy (parent), blending modes, and transform properties
  - [ ] Placement: anchor presets and allowSubPixel offsets
  - [ ] Resolution: compute and store `resolution.effectiveSize`
  - [ ] Background image layer: support placement (x, y, width, height), anchor, allowSubPixel and transform properties (rotation, scaleX, scaleY, skewX, skewY)
- Pixel data encoding
  - [ ] Support `raw`, `rle`, and `sparse` encodings
  - [ ] Implement `pixels.defaultValue` and `pixels.compression` fields
- Animations
  - [ ] Top-level `animations` object (fps, loops, pingPong, interpolation)
  - [ ] Detailed frame data: duration, overrides, tweens, events, tags, priority, blendMode
  - [ ] `animationController` (defaultAnimation, transitions, tagGroups)
- Resources management
  - [ ] `resources` section for sounds, images, scripts and a UI panel
- JSON import/export
  - [ ] Validate against the MRPAF JSON Schema on import/export
- UI enhancements
  - [ ] Resource editor panel
  - [ ] Advanced animations editor and timeline (per-frame editing)
  - [ ] Advanced layer properties panel (blending modes, transforms)

*Generated and maintained by the AI agent during development to ensure context continuity.*

## Pending UI/Layout Improvements
以下の画面レイアウトおよび UI 強化項目は、次フェーズでの実装が推奨されます。

- **Main Toolbar**
  - 新規プロジェクト作成・名前を付けて保存などファイルメニューの追加
  - Undo／Redo ボタンの追加
  - 各操作ボタンにアイコンとツールチップ表示
  - 現在のズーム倍率表示
- **Left Panel (Tools & Layers)**
  - アクティブツールの視覚的ハイライト
  - グリッド表示の ON/OFF トグル
  - レイヤーリストに名前・サムネイル表示、Lock／Hide トグル
  - レイヤーごとのブレンドモード選択・不透明度スライダー
  - レイヤー階層とドラッグ＆ドロップによる並び替え
- **Canvas Area**
  - マウス座標・下のピクセル色を示すステータスバー
  - 透明部分用チェッカーボード背景
  - ブラシサイズのプレビュー表示（カーソル形状）
- **Right Panel (Tabs)**
  - Resources タブの実装
  - Animation タブ：フレームのドラッグ＆ドロップ並び替え、キーフレーム編集 UI
  - Palette タブ：色のドラッグ＆ドロップ並び替え、グループ管理
  - Settings タブに「適用」ボタンまたは即時反映インジケータ
- **Bottom Toolbar (Animation Controls)**
  - 再生中／停止中のステータスインジケータ強化
  - イージングやトランジション設定 UI
- **Global UI**
  - メニューバー／コンテキストメニュー（右クリックメニュー）
  - キーボードショートカット一覧／ヘルプオーバーレイ
  - レスポンシブレイアウト対応
  - ダークテーマ切り替え

## Infrastructure & Refactoring Roadmap
以下のインフラ改善とアーキテクチャ整備は、各機能実装のタイミングを見ながら段階的に導入します。

- テスト自動化 & CI
  - [ ] `packages/core` に対するユニットテスト基盤 (Jest/Vitest) の構築
  - [ ] GitHub Actions 等でのテスト自動実行パイプライン設定
  - *タイミング*: 最優先。コア機能の安定化後、他パッケージへ展開*
- 型安全化 (TypeScript)
  - [ ] `packages/core` の TypeScript 移行
  - [ ] `packages/renderer`・`packages/editor` の段階的 TS 化
  - *タイミング*: コアテスト整備完了後、型付与によりバグを早期検出*
- クリーンアーキテクチャ適用
  - [ ] ユースケース／エンティティ層とインターフェイス層の分離
  - [ ] 依存方向を UI → Core に固定
  - *タイミング*: 型安全化完了後、新規大規模機能（リソース管理パネル等）実装前*
- 部分的 React 移行
  - [ ] リソースパネル、アニメーションタイムラインなど複雑 UI の React コンポーネント化
  - [ ] Context API or Redux Toolkit による `project` 状態の一元管理
  - *タイミング*: クリーンアーキテクチャ適用後、特定パーツ開発の際に順次導入*
  
### テスト実行
1. ルートディレクトリで `npm install` を実行
2. `npm test` でユニットテストを実行し、コア機能の検証を行います