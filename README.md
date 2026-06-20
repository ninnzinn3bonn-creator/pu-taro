# AX Factory for Codex

Codexの複数セッションと民泊業務の自動化状態を、工場ゲーム風の外部Web UIとして可視化するMVPです。

## 起動

```powershell
npm install
npm run dev
```

ブラウザで `http://127.0.0.1:4173` を開きます。

Node.js 22以上を使用してください。Windows版Codexに同梱されたNodeが利用可能な場合、`npm run build` は互換ランタイムを自動選択します。別のNodeを指定する場合は `AX_FACTORY_NODE` に実行ファイルを設定できます。

## 現在の実装

- 民泊業務を施設・機械・ライン・承認ゲートとして表示
- Codexセッションを状態つき作業員として表示
- `running / waiting_input / waiting_approval / completed / error / idle` を可視化
- 業務ごとの関連ファイル、プロンプト、禁止事項、現在タスクを表示
- `public/data/state.json` を5秒ごとに読み込み
- セッション状態の手動上書きと承認・却下をローカル保存
- 完了・承認時の実績トースト
- 実行ログ、承認待ち、エラーの下部ドック

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

## 次の接続点

現状の `state.json` はモックですが、`plugin/ax-factory` にCodex PluginとLifecycle Hooksを同梱しています。Hookはプロンプト本文を保存せず、セッションID、イベント、時刻、ツール名、作業ディレクトリだけを記録します。

Plugin Hookが生成した `PLUGIN_DATA/state.json` を画面へ同期する例:

```powershell
npm run bridge -- --source "C:\path\to\plugin-data\state.json"
```

別ターミナルで `npm run dev` を起動します。

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
