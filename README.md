# AX Factory for Codex

Codexの複数セッションと民泊業務の自動化状態を、工場ゲーム風の外部Web UIとして可視化するMVPです。

## 起動

```powershell
npm install
npm start
```

ブラウザで `http://127.0.0.1:4173` を開きます。

Node.js 22以上を使用してください。Windows版Codexに同梱されたNodeが利用可能な場合、`npm run build` は互換ランタイムを自動選択します。別のNodeを指定する場合は `AX_FACTORY_NODE` に実行ファイルを設定できます。

`npm start`（`dev:live` と同じ）は民泊元データの読取専用同期、Codex Hook状態の同期、Vite起動をまとめて行います。PluginのインストールとHookの信頼設定を含む手順は [docs/OPERATIONS.md](docs/OPERATIONS.md) を参照してください。

## 現在の実装

- 民泊業務を施設・機械・ライン・承認ゲートとして表示
- Codexセッションを状態つき作業員として表示
- `running / waiting_input / waiting_approval / completed / error / idle` を可視化
- 業務ごとの関連ファイル、プロンプト、禁止事項、現在タスクを表示
- `public/data/state.json` を5秒ごとに読み込み
- セッション状態の手動上書きと承認・却下をローカル保存
- 完了・承認時の実績トースト
- 実行ログ、承認待ち、エラーの下部ドック
- 民泊元リポジトリのP1〜P11進捗、集計KPI、鮮度、在庫・価格見直し日を読取専用表示
- ゲスト情報、予約ID、鍵・コード、URL、DM本文などを取込対象外にする許可リスト型インポーター

## データ

初期データは `public/data` にあります。

- `business_areas.json`
- `tasks.json`
- `agents.json`
- `codex_sessions.json`
- `runs.json`
- `approvals.json`
- `state.json`

整合性確認:

```powershell
npm run check:data
```

## Codex Plugin接続

`plugin/ax-factory` にCodex PluginとLifecycle Hooksを同梱しています。repo-scoped marketplace は `.agents/plugins/marketplace.json` です。Codex再起動後にPluginsから `AX Factory Local` を選び、Pluginをインストールしてください。その後、新しいスレッドで `/hooks` を開いてHookを確認・信頼します。

Hookはプロンプト本文を保存せず、セッションID、イベント、時刻、ツール名、作業ディレクトリだけを記録します。安定保存先は `~/.ax-factory/plugin-data` です。

```powershell
npm run bridge
```

詳細は [docs/OPERATIONS.md](docs/OPERATIONS.md) を参照してください。

Hook単体テスト:

```powershell
npm run test:hooks
```

Plugin検証:

```powershell
npm run validate:plugin
```

全チェック:

```powershell
npm run check
```

既存の進捗ダッシュボードは `docs/legacy-dashboard.html` に退避して参照可能にします。
