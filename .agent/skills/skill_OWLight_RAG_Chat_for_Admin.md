# OWLight_RAG_Chat_for_Admin

## スキル概要

行政向けサービス「OWLight」で、行政ナレッジ・ドキュメントを対象にした **根拠付きRAGチャット** を実現するアーキテクチャと運用ルールを定義するスキル。

- データは Supabase（ナレッジ・会話履歴）と GCS（行政ドキュメント＋ナレッジJSON）に集約
- 検索・RAG・マルチターン会話は Vertex AI Search（Enterprise + Advanced Generative Answers）に委譲
- OWLight 側はチャットUIと業務ロジックに集中

---

## アーキテクチャ指針

### 1. データレイヤ

- Supabase
  - 行政ナレッジテーブル（条例・要綱・FAQ・業務マニュアルなど）
  - 会話履歴（質問、回答、根拠ドキュメントID、タイムスタンプなど）

- Cloud Storage（GCS）
  - 行政ドキュメント（PDF / Word / HTML / テキスト）
  - Supabase ナレッジを書き出した JSON/JSONL
    - 例: `knowledge_export.jsonl`（1行1レコード）
    - 各レコードに少なくとも以下を含める:
      - id
      - title
      - body（本文 / 要約）
      - tags / category / department などのメタ情報

- BigQuery は **使用しない**。構造化データも JSON として GCS に集約する。

### 2. データ反映フロー

- Supabase → GCS（ナレッジ同期）
  - バッチ or 定期ジョブで以下を実施:
    - ナレッジテーブルを取得
    - JSON/JSONL に変換
    - GCS の指定バケットにアップロード
  - 差分反映 or フルリビルドは運用ポリシーで決定（夜間バッチなど）

- 行政ドキュメント → GCS
  - ファイルアップロード（運用者UI or バックエンド）
  - アップロード後のパスをメタデータテーブルに保存しておくと、後続処理で参照しやすい

---

## 検索・RAGレイヤ

### 1. Vertex AI Search の構成

- プラン
  - Enterprise Edition（Core Generative Answers）
  - Advanced Generative Answers（ON）

- Data store 設計
  - 1つ以上の search data store を作成
    - ソース:
      - GCS のドキュメントバケット（PDF/HTML/テキスト）
      - GCS のナレッジJSONバケット（JSON/JSONL）
  - インデックス設定:
    - タイトル、本文、メタ情報（tags, department, category 等）を searchable / filterable として登録
    - 必要に応じてランキングチューニング（Boost設定）

### 2. 機能利用ポリシー

- Core Generative Answers
  - すべての問い合わせの基本回答は Core Generative Answers を使用
  - 常に「根拠となるドキュメントスニペット＋リンク」を含めて返す設定にする
- Advanced Generative Answers
  - マルチターン会話（フォローアップクエリ）を前提とした設定を有効化
  - 関連質問の提案や、複雑な質問の分解（multi-step）を有効化
  - 画像・表などのマルチモーダル回答は、OWLight のUX方針に応じてON/OFFを決める

---

## 会話・アプリレイヤ（OWLight）

### 1. チャットフロー

1. ユーザーがチャットUIから質問を送信
2. バックエンドが、会話履歴＋ユーザー質問を元に Search の Answer API（Enterprise + Advanced）を呼び出し
3. Search が以下を返却:
   - 回答テキスト（生成）
   - 根拠ドキュメントのスニペット・URL・メタデータ
   - Advanced有効時は関連質問候補や、分解された内部クエリ情報など
4. OWLight サーバー:
   - 必要に応じて、該当ドキュメントの全文を GCS / Supabase から再取得し、追加のフォローアップ呼び出しに利用
   - レスポンスをユーザー向けに整形し、チャットUIへ返却
5. 会話履歴（質問・回答・根拠）を Supabase に保存

### 2. 会話履歴管理

- Supabaseの `chat_sessions` / `chat_messages` テーブルなどで管理
- 保存内容の例:
  - `sessions`: id, user_id, started_at, ended_at, metadata
  - `messages`: id, session_id, role(user/assistant), content, source_doc_ids, created_at
- マルチターン対応:
  - 直近 N メッセージ（例: 5〜10ターン）をコンテキストとして Search に渡す
  - 長期履歴はSupabaseに蓄積しつつ、Searchへのコンテキストは要約 or 間引きする

---

## LLM層（補助的利用方針）

- 機能
  - Gemini 2.5 Flash を主に「整形・フォーマット調整」にのみ使用
- 原則
  - どの文書を根拠に何を答えるか、という「判断・検索」は Vertex AI Search に任せる
  - Gemini は:
    - 箇条書き整形
    - 表形式への変換
    - 口調・敬語統一 などユーザビリティ向上のための後処理に限定
- コスト観点
  - 基本は Search 側の料金が支配的になるように設計し、Geminiは低トークン利用に抑える

---

## 費用モデル（BigQueryなし、Advanced込み）

### 開発フェーズ（MVP/PoC）

- 前提
  - 月 〜10,000クエリ
  - データ量：数GB〜10GB

- 概算
  - Search クエリ: 無料トライアル枠内に収まる想定
  - Search インデックス: 〜数ドル/月
  - Gemini: 無料ティア＋少量利用 → 0〜数ドル/月
  - GCS/Supabase: 数ドル〜十数ドル/月

- 目安
  - **総額: 約 $0〜$30/月 レンジ**

### 小規模本番（1〜2団体）

- 前提
  - 月 50,000クエリ
  - データ量: 10GB

- 概算
  - Search クエリ:
    - Enterprise(Core): $4 × 50 = $200/月
    - Advanced: $4 × 50 = $200/月
    - 合計: $400/月
  - Search インデックス:
    - 10GB × 〜$4.5/GB/月 ≒ $45/月
  - Gemini (補助的): $1〜$5/月
  - GCS/Supabase/その他: 数ドル〜十数ドル/月

- 目安
  - **総額: 約 $450〜$500/月 レンジ**

---

## 設計上のポイント（OWLight向け）

- BigQuery は使わず、データソースは Supabase + GCS に統一する
- 検索・RAG・マルチターン会話ロジックは Vertex AI Search（Enterprise + Advanced）に極力寄せる
- OWLight 側は:
  - データ同期（Supabase→GCS）
  - 会話履歴・ログ管理
  - 行政業務に合わせたUI/UX設計
  に専念する
- Advancedは最初からONにし、「行政向けに十分リッチな会話体験」を標準提供する前提でプラン設計を行う