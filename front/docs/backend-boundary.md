# バックエンド移管の境界

依存管理はtkb_2625のpnpm workspaceに統合しています。APIの実接続は今回追加していません。

## 現在の呼び出し経路

```text
画面 → useRogaining → 非同期サービス → デモ業務処理 → localStorage
                         ↓ 将来の差し替え
                    APIアダプター → appview / PDS
```

`src/service.js` の `createDemoService()` は、ブラウザ内でバックエンドを模擬するアダプターです。画面から状態を書き換える関数や `localStorage.save` は呼びません。`load()`・`submitPhoto()`・`reviewSubmission()` の応答だけを画面に反映します。通信処理はPromiseとして扱い、ロード中・再試行・送信中の状態を管理しています。

## サービス契約

- `load()` → `{ state: Snapshot, warning: string }`
- `submitPhoto({ checkpointId, image })` → `Snapshot`
- `reviewSubmission({ id, decision, reason })` → `Snapshot`
- `endDemo()`・`resetDemo()` → `Snapshot`。ローカルデモ専用です。

`Snapshot` は `{ version, endsAt, submissions, team, checkpoints, points }` です。`points` はサービスの確定結果を表示し、画面で増減させません。エラー時はPromiseをrejectし、直前の確定状態を保持します。

これはフロントエンド内の契約であり、新規HTTPエンドポイントの仕様ではありません。APIアダプターで既存lexiconのレスポンスから変換します。バージョン番号は現在のデモ保存形式を示すもので、APIのバージョンではありません。

## 責務分担

| フロントエンドに残す | バックエンドへ移す／必ず再検証する |
| --- | --- |
| タブ、モーダル、入力、プレビュー、ソート、絞り込み | 提出・審査結果の永続化と取得 |
| 画像縮小などの転送前処理 | 画像形式・容量・内容のサーバー側検証 |
| GPS取得・利用許可の案内 | 提出座標・対象チェックポイントの検証 |
| 終了日時からの残り時間表示 | サーバー時刻での大会終了・提出可否判定 |
| 送信ボタンの重複操作抑制 | 冪等性、同時提出・同時審査の排他制御 |
| サービスが返したポイント・状態の表示 | 得点の確定・重複加算防止・チーム集計 |
| 通信中・エラー・再試行の表示 | 利用者認証、参加資格、審査権限 |

`src/data.js` の提出・審査・得点計算とサンプルデータ、`src/repository.js` のlocalStorage実装はデモ専用です。これらを信頼境界として本番に流用せず、API側で業務ルールを実装してください。ブラウザが送った得点・承認状態・端末時刻は信用しません。

## 既存appview／lexiconsとの接続時の確認事項

- `appview/src/rogaining` の取得ハンドラーは現状プレースホルダーです。先に実データの取得実装が必要です。
- appviewはサービスJWTを検証します。メソッドごとの `lxm` とサービスDID／audienceに沿った認証経路を用意し、トークンをVite環境変数やlocalStorageに固定しないでください。
- `submit`・`approve` はlexicon上のレコードです。新しいPOST APIが存在すると仮定せず、認証済みのPDSレコード作成とappviewへの反映を設計してください。
- 既存 `submissionView.status` は `pending`／`approved` です。UIの「不可」と不承認理由、再提出履歴に対応するデータモデルをチームで決める必要があります。
- 既存のランキングは参加者単位です。デモのチーム・メンバー・チーム得点との対応を決めてください。
- 既存submitレコードにはevent/checkpointのstrongRef、位置、photo blobが必要です。デモの短いID・data URLをそのまま送らず、URI/CID・Blob参照への変換とアップロード処理を追加してください。
- 現行submitの画像上限は2,000,000バイトです。UIの8MBは縮小前の入力上限です。API接続時には縮小後のバイト数を検証し、上限超過は再圧縮またはエラーにしてください。

## 移行手順

1. 上記の状態・チーム・認証の仕様を確定する。
2. APIアダプターを実装し、サーバー応答をSnapshotへ変換する。
3. `useRogaining` のサービス生成箇所を切り替える。画面やブラウザ画像処理は維持する。
4. 承認結果の反映方法（再取得・ポーリング等）と、通信失敗時の冪等な再試行を追加する。
5. APIモードでは管理者デモ・初期化・ローカル終了操作を無効化し、失敗時にデモデータへ自動フォールバックしない。
6. サーバー側の競合・重複・終了時刻・権限の検証を統合テストし、実端末でも提出から審査まで確認する。
