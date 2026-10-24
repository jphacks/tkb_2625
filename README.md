# サンプル（プロダクト名）

[![IMAGE ALT TEXT HERE](https://jphacks.com/wp-content/uploads/2026/07/IMG_5316.png)](https://www.youtube.com/watch?v=piaNsc6ilBI)

## 製品概要
### 背景(製品開発のきっかけ、課題等）
### 製品説明（具体的な製品の説明）
### 特長
#### 1. 特長1
#### 2. 特長2
#### 3. 特長3

### 解決出来ること
### 今後の展望
### 注力したこと（こだわり等）
* 
* 

## 開発技術
### 活用した技術
#### API・データ
* 
* 

#### フレームワーク・ライブラリ・モジュール
* 
* 

#### デバイス
* 
* 

### 独自技術
#### ハッカソンで開発した独自機能・技術
* 独自で開発したものの内容をこちらに記載してください
* 特に力を入れた部分をファイルリンク、またはcommit_idを記載してください。

## ローカル開発（pnpm workspace）

Node.js 24、pnpm 11.0.0を使用します。依存関係はリポジトリ直下のpnpm-lock.yamlで一元管理します。

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev            # frontを起動
corepack pnpm dev:all        # front + appviewを起動
corepack pnpm dev:client     # 既存clientを起動
corepack pnpm dev:appview    # appviewを起動
corepack pnpm test           # テスト
corepack pnpm typecheck      # 各パッケージの型チェック
corepack pnpm build          # 全パッケージをビルド
corepack pnpm build:front    # frontのみビルド
```

PowerShellでは `corepack.cmd pnpm` を使用できます。pnpm導入済みの場合は `pnpm` だけでも実行できます。

依存追加は `pnpm --filter roam-rogaining add <package>`、`pnpm --filter appview add <package>` のように対象を指定します。各サブディレクトリで別のロックファイルは作成しません。

- [frontの起動・レビュー手順](front/README.md)
- [バックエンドへの責務移管](front/docs/backend-boundary.md)

frontは現在デモアダプターを使います。`dev:all` は2プロセスを起動しますが、APIの実接続・認証を追加するものではありません。

### Windowsでfrontのみ開発する場合

appviewのbetter-sqlite3はネイティブビルドが必要です。全体インストールにはPython・Visual StudioのC++開発ツール・Windows SDKを用意してください。この作業環境ではWindows SDK不足でSQLiteのビルドを完了できていません。frontだけを開発する場合は共通ロックファイルを使って対象を絞れます。

```sh
corepack pnpm --filter roam-rogaining install --frozen-lockfile
corepack pnpm dev
```

ルートスクリプトもCorepack経由でpackageManagerのバージョンを使うため、環境内の別バージョンのpnpmには依存しません。

Windows SDKの準備後は corepack pnpm rebuild better-sqlite3 でネイティブ依存を再構築してください。型チェック・ビルドの成功と、SQLiteの実行確認は別の検証です。
