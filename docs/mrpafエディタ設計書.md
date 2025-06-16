## 1. はじめに

### 1.1 目的

本設計書は、MRPAF (Multi-Resolution Pixel Art Format) v2.0.1 に準拠したリファレンス・ピクセルアートエディタの設計をまとめることを目的とします。

### 1.2 背景

従来のピクセルアートツールは大型・高機能化が進み、小規模作品向けの軽量かつ柔軟な編集体験が求められています。本エディタはMRPAFの強みであるマルチ解像度レイヤー／サブピクセル座標／JSONベース拡張性を活かし、小規模ドット絵アーティストのワークフローを支援します。

## 2. 範囲 (Scope)

- MRPAF v2.0.1 のスキーマに準拠したファイルの読み書き
- マルチ解像度レイヤーレンダリング
- 基本的なピクセル編集ツール (ペン、消しゴム、バケツ塗り)
- レイヤー管理 (追加／削除／順序入替／可視・ロック／不透明度)
- 背景画像レイヤーの読み込み・表示
- ズーム／パン／グリッド
- Onion Skin、Symmetry、ブラシプリセット
- アニメーションプレビュー (timeline)
- PNG/GIFエクスポート

## 3. システム概要

- **Monorepo構成**
  - packages/core: MRPAF型定義・JSON Schema検証・IO
  - packages/renderer: Canvas/WebGL合成エンジン
  - packages/editor: React UIコンポーネント
- **配布形態**: Web版（PWA）＋ Electronデスクトップ版

## 4. 機能要件

| 機能カテゴリ | 機能名           | 詳細                                      |
| ------ | ------------- | --------------------------------------- |
| ファイルIO | 読み込み          | `.mrpaf.json` / MessagePack バイナリのロードと検証 |
|        | 書き出し          | 編集後データのJSON化・Validation                 |
| 描画     | レイヤー合成        | マルチ解像度・サブピクセル対応                         |
| 編集     | ペン／消しゴム       | 1ドット単位の描画                               |
|        | バケツ塗り         | Flood Fill                              |
| レイヤー管理 | 追加／削除／並び替え    | ドラッグ＆ドロップ対応                             |
|        | 可視・ロック・不透明度   | UI上で即時切替                                |
| 背景画像   | PNG読み込み       | Data URI/URL指定、opacity調整、ロック            |
| 操作支援   | Onion Skin    | 前後フレーム透過重ね                              |
|        | Symmetry      | 水平・垂直ミラー描画                              |
|        | ブラシプリセット      | マスク形状登録                                 |
| プレビュー  | アニメーションタイムライン | 再生・停止・速度調整                              |
| エクスポート | PNG/GIF       | 単一画像・スプライトシート・アニメGIF                    |

## 5. 非機能要件

- **パフォーマンス**: レイヤー数5、解像度合計512×512程度までリアルタイム操作可能
- **起動時間**: デスクトップ版で3秒以内
- **対応OS**: Windows/macOS/Linux
- **拡張性**: プラグイン機構を想定し、将来的な機能追加が容易

## 6. アーキテクチャ

```plaintext
┌─────────────────────┐       ┌──────────┐
│    mrpaf-editor     │◀──────│renderer  │
│  (React UI Layer)   │       └──────────┘
│                     │              ▲
│  - CanvasWrapper    │              │
│  - ToolBar          │        ┌─────────────┐
│  - LayerPanel       │───────▶│mrpaf-core   │
└─────────────────────┘        │(Schema, IO) │
                                └─────────────┘
```

## 7. データモデル

- `MRPAF` インターフェース
  - `version`, `metadata`, `coordinateSystem`, `canvas`, `palette`, `layers[]`, `editorSettings[]`
- `Layer` 型
  - 共通: `id`, `type`, `visible`, `locked`, `opacity`
  - pixel: `pixels` (ArrayData/RLE/Sparse)
  - image: `source.uri`, `width`, `height`

## 8. UIフロー

1. アプリ起動 → 空白キャンバス表示
2. File > Open → `.mrpaf.json` 選択 → Schema検証 → レイヤー/キャンバス初期化
3. レイヤーパネルで背景レイヤー追加 (PNG)
4. ツールパネルでペン選択 → キャンバスクリックで描画
5. Timelineタブでアニメーション再生確認
6. File > Export > PNG/GIF

## 9. スケジュール概略

| フェーズ   | 期間  | 主な成果物                       |
| ------ | --- | --------------------------- |
| 設計     | 1週間 | 本設計書                        |
| 基本実装   | 2週間 | core+renderer PoC, Canvas表示 |
| UI統合   | 3週間 | editor: ファイルIO, 基本ツール       |
| 機能追加   | 4週間 | OnionSkin, Symmetry, Export |
| テスト＆CI | 2週間 | Unit/E2Eテスト, CI設定           |

## 10. 今後の拡張候補

- ブレンドモード・エフェクト
- DitheringProfiles
- Slice/AnimationTags/Hotspots
- コラボコメント・履歴機能

---

以上がMRPAF準拠ピクセルアートエディタの設計書案です。具体的な実装に向けてご活用ください！

