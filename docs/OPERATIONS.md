# AX Factory 運用手順

## 1. 通常起動

リポジトリ直下で次を実行します。

```powershell
npm install
npm start
```

`npm start` は以下をまとめて実行します。

- `D:\開発\auto house` から許可済み集計情報を読取専用で同期
- Codex Hook の安定状態ファイルを5秒ごとに画面へ同期
- 民泊データを60秒ごとに再同期
- `http://127.0.0.1:4173` で画面を起動

民泊リポジトリが別の場所にある場合:

```powershell
npm start -- --source "D:\path\to\auto house"
```

## 2. Codex Plugin を接続

このリポジトリには repo-scoped marketplace
`.agents/plugins/marketplace.json` と Plugin `plugin/ax-factory` が含まれます。

1. Codex を再起動する
2. Plugins を開く。CLI では `/plugins`
3. `AX Factory Local` を選び、`ax-factory` をインストールして有効化する
4. 新しいスレッドを開始する
5. `/hooks` を開き、AX Factory の新規または変更済みHookを確認して信頼する

Hook はプロンプト本文、ツール引数、ツール結果を保存しません。保存対象は
セッションID、イベント名、時刻、ツール名、作業ディレクトリです。

## 3. 状態ファイル

安定保存先:

```text
~/.ax-factory/plugin-data/state.json
~/.ax-factory/plugin-data/events.jsonl
```

Plugin固有の `PLUGIN_DATA/state.json` にも同じ状態を書きます。イベントログは
5 MBで `events.1.jsonl` へローテーションします。

別の安定保存先を使う場合:

```powershell
$env:AX_FACTORY_STABLE_DATA = "D:\data\ax-factory"
npm start
```

## 4. 手動同期

民泊データだけを同期:

```powershell
npm run sync:auto-house
```

Codex状態だけを画面へ同期し続ける:

```powershell
npm run bridge
```

状態元を明示する場合:

```powershell
npm run bridge -- --source "C:\path\to\state.json"
```

## 5. 日常確認

- 「データソース」で鮮度警告、元リポジトリのブランチと変更件数を確認する
- P1〜P11の進捗と優先タスクを確認する
- `Codex runtime connected` になっていることを確認する
- 元データに変更を加えない。AX Factory は許可リスト方式の読取専用取込だけを行う
- ゲスト氏名、連絡先、予約ID、鍵・コード、APIキー、URL、DM本文は取り込まない

## 6. 検証

```powershell
npm run check
```

個別確認:

```powershell
npm run test:source
npm run test:hooks
npm run validate:plugin
npm run build
```

通常の `npm run build` は、共有用成果物への実集計値混入を防ぐため
`source_snapshot.local.json` を `dist` から除外します。閉じたローカル環境向けの
静的成果物に実集計を含める場合だけ、明示的に次を使用します。

```powershell
$env:AX_FACTORY_INCLUDE_LOCAL_SNAPSHOT = "1"
npm run build
```
