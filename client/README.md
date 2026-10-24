# ROAM client

`front` の参加者向け画面を、既存の client の React・TypeScript・Vite 構成へ移したものです。

## 起動

Node.js 24、pnpm 11 を使用します。リポジトリ直下から実行してください。

```powershell
cd client
corepack.cmd pnpm@11.0.0 install --frozen-lockfile
corepack.cmd pnpm@11.0.0 dev
```

表示されたURLを開くと `/cards` へ移動します。macOS/Linuxでは `corepack.cmd` を `corepack` に読み替えます。

```powershell
corepack.cmd pnpm@11.0.0 typecheck
corepack.cmd pnpm@11.0.0 build
corepack.cmd pnpm@11.0.0 preview
```

成果物は `client/dist/` に生成します。静的配信では `/cards`・`/team`・`/map`・`/admin` への直接アクセスを `index.html` にフォールバックさせてください。

## 画面

- `/cards`：チェックポイントの一覧、絞り込み・並び替え、写真選択・提出・再提出。
- `/team`：チーム情報、承認済みポイント、提出履歴。
- `/map`：Leafletによるチェックポイント・デモ経路の表示、任意操作でのGPS記録と方位取得。
- `/admin`：既存の写真審査デモ。承認・理由付き不承認、大会終了、デモ初期化。

初期ポイントは80ptです。「緑の歩道橋」の写真を提出して `/admin` で承認すると、各画面の得点が120ptになります。

## データと端末機能

バックエンド接続はなく、チーム・場所・画像はサンプルです。写真・審査結果・終了時刻を localStorage に保存します。`front` と同じ保存形式・キーを使用するため、同じオリジンで開けば既存デモデータを読み込めます。異なるポートや別端末では共有されません。認証・複数タブ同期はなく、管理者画面もデモ用です。

写真はJPEG・PNG・WebPの8MBまで対応し、長辺1200px以下のJPEGに縮小します。保存に失敗した操作は反映しません。

地図はLeafletとOpenStreetMap標準タイルを使用し、APIキーは不要です。出典は地図内に表示します。背景タイルにはネットワーク接続が必要です。

GPSはHTTPSまたはlocalhostと位置情報許可が必要です。経路は地図画面内だけで保持し、離脱時に監視を解除します。方位センサーは対応端末でのみ利用できます。カメラ・GPS・方位の動作は実端末で確認してください。

`src/lexicons` と既存の `gen:lexicon` コマンドはそのまま利用できます。`front` の元ファイルも残しています。
