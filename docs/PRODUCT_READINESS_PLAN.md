# AX Factory 実運用化計画

## 目的

`D:\開発\auto house` を民泊運用の正本として読み取り専用で参照し、AX Factoryから以下を確認できる状態を作る。

- P1〜P11の実進捗と状態
- 未完了タスク
- 財務・稼働・実働時間・在庫の集計値
- データの最終更新日と鮮度
- 人間承認が必要な操作
- Codexセッションの状態
- AX Factory上で行った承認・状態変更の監査履歴

## データ境界

### 読み取り対象

- `AGENTS.md`
- `docs/21_project_progress_snapshot_2026-06-16.md`
- `tasks/self_tasks.md`
- `company_agent/finance/operational_metrics_2026.md`
- `company_agent/finance/sources/yururi_monthly_payments_gid1654969878.csv`
- `company_agent/finance/operator_time_log_actual.csv`
- `company_agent/rules/inventory_actual.csv`
- `company_agent/pricing/pricing_review_schedule.md`

### 取り込まないもの

- 宿泊者名、予約番号、連絡先
- 予約固有URL
- 鍵番号、チェックインコード、暗証番号
- DM原文、LINE原文
- 音声、写真、スクリーンショット
- `.env`、APIキー、Cookie、認証情報
- 生の予約明細、レビュー本文

## 実装原則

1. インポーターは読み取りAPIだけを使用する。
2. 出力先が正本ディレクトリ内なら処理を拒否する。
3. UIには集計値と出典ファイルの相対パスだけを表示する。
4. モックデータと正本同期データを画面上で区別する。
5. 古いデータ、欠損、未確定値を成功値として扱わない。
6. 承認や状態変更は監査履歴へ残す。
7. 外部送信、価格変更、返金、予約変更はAX Factoryから実行しない。

## 完了条件

- `npm run sync:auto-house` が正本を変更せず安全なスナップショットを生成する。
- 実進捗P1〜P11が工場マップへ表示される。
- 財務・稼働・時間・在庫の主要集計が表示される。
- stale/missing状態が警告される。
- 承認・状態変更が監査履歴へ記録され、JSONでエクスポートできる。
- インポーターの安全性テスト、データ整合性、ビルド、ブラウザE2Eが通る。
