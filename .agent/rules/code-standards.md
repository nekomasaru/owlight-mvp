# OWLight Coding Standards & Development Rules

**Purpose**: Antigravity エージェントが常に守るべき標準ルール  
**Created**: 2026-01-24  
**Status**: MVP Active  

---

## 1. TypeScript / React 標準

### 型安全性

- ❌ **`any` 型は禁止**。具体的な型定義が必須
- ✅ すべての関数は戻り値の型を明示
- ✅ interface/type で契約を定義してから実装
- ✅ React コンポーネントは props の型を Props interface で定義

### エラーハンドリング

- ✅ **すべての API 呼び出しは try-catch で囲む**
- ✅ Supabase クエリの `error` フィールドを常にチェック
  ```typescript
  const { data, error } = await supabase.from('table').select();
  if (error) throw new Error(`DB Error: ${error.message}`);
  ```
- ✅ null/undefined チェックは **必ず実装**
  ```typescript
  if (!data || data.length === 0) {
    throw new Error('No data found');
  }
  ```
- ✅ エラーメッセージは具体的に（ユーザーが対応できるレベル）

### コード品質

- ❌ `console.log()` / `console.debug()` はコミット禁止
- ❌ `// TODO` / `// FIXME` コメントで不完全なまま merge しない
- ✅ 1 ファイルは最大 300 行（超過したら分割）
- ✅ 関数は最大 50 行（長い場合は処理を分割）
- ✅ 変数名は英語で、意図が明確に（`x`, `temp` NG）

### テスト

- ✅ 新規ファイル追加時は対応する `.test.ts` ファイルも追加
- ✅ テストは「正常系」「null/undefined」「エラーケース」の 3 パターン
- ✅ テストカバレッジ目標 **80% 以上**

### Import 管理

- ✅ SDK（Firebase / Supabase）は **絶対に直接 import しない**
  - 代わりに `IAuthService`, `IKnowledgeRepository` など Interface 経由
- ✅ 循環 import は禁止
- ✅ unused import は削除

---

## 2. Database (Supabase) 標準

### スキーマ & RLS

- ✅ すべての本番テーブルは **RLS（Row-Level Security）有効**
- ✅ `knowledge_logs` テーブルは `select_own_or_published` ポリシー
- ✅ 住民情報を含むテーブルは暗号化を前提

### クエリ実装

- ✅ **insert / update / delete 前に必ず入力検証**
  ```typescript
  if (!userId || userId.trim() === '') throw new Error('Invalid userId');
  const { error } = await supabase.from('table').insert([...]);
  if (error) throw new Error(`Insert failed: ${error.message}`);
  ```

- ✅ **すべての DB 操作は error チェック実装**
  ```typescript
  const { data, error } = await supabase.from('table').select();
  if (error) throw new Error(`Query failed: ${error.message}`);
  ```

- ✅ null 許可フィールドには明示的に null チェック
  ```typescript
  const summary = data.summary ?? 'No summary'; // null-safe
  ```

- ✅ UUID は `gen_random_uuid()` で自動生成（手動 UUID 割り当てない）

- ✅ TIMESTAMPTZ フィールドは タイムゾーン考慮（UTC 推奨）

### トランザクション

- ✅ 複数テーブルへの同時 insert/update は トランザクション使用
- ✅ 部分失敗時の rollback 必須

### パフォーマンス

- ✅ 大量データ取得時は pagination 実装（limit + offset）
- ✅ N+1 クエリ問題回避（JOIN を使う）
- ✅ インデックスが張られた列でのフィルタリング

---

## 3. Gemini API 統合標準

### JSON パース

- ✅ Gemini 出力の JSON パースは **必ず try-catch で囲む**
  ```typescript
  try {
    const parsed = JSON.parse(geminiResponse);
  } catch (e) {
    throw new Error(`Failed to parse Gemini response: ${e.message}`);
  }
  ```

- ✅ JSON parse 失敗時は **最大 3 回リトライ**
- ✅ リトライ後も失敗なら呼び出し元へ throw

### スキーマ検証

- ✅ Gemini 出力は スキーマ検証必須（必須フィールド確認）
- ✅ 欠落フィールドがあれば具体的なエラーメッセージ

### DLP（Data Loss Prevention）

- ✅ 住民情報（氏名、住所、電話番号等）を Gemini に送信する場合は **必ずマスク**
  ```typescript
  const masked = data.map(d => ({
    ...d,
    name: '***',
    phone: '***',
  }));
  ```

- ✅ マスク後のデータを Gemini に送信

---

## 4. Git & Commit 標準

### コミット前チェック

- ✅ **`npm run type-check`** → ゼロエラー必須
- ✅ **`npm test`** → 全テスト pass 必須
- ✅ `git diff --staged` で確認：
  - 無関連変更ナシ？
  - console.log ナシ？
  - import 一貫性？

### コミットメッセージ

- ✅ 英語で記述
- ✅ 接頭語を使用：`feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- ✅ 1 行目は 50 文字以内
- 例：
  ```
  feat: add Supabase knowledge repository
  fix: null check in knowledge distillation
  refactor: extract validation logic
  ```

### ブランチ戦略

- ✅ feature ブランチで開発（`feature/xxx`）
- ✅ main マージ前に code review 1 人以上
- ✅ Squash merge 推奨（commit 履歴を整理）

---

## 5. Antigravity エージェント使用時の制約

### タスク分解

- ✅ **1 タスク = 1 ファイル変更** が原則
- ❌ 複数ファイル同時変更NG（不整合リスク）
- ✅ 複数ファイル必要な場合は段階化：
  1. インターフェース定義
  2. 実装クラス
  3. UI 層順次変更

### 出力検証

- ✅ エージェント出力後、必ず以下を実行：
  1. **Red flag チェック** - console.log / any 型 / TODO コメント？
  2. **型チェック** - `npm run type-check`
  3. **ユニットテスト** - `npm test`
  4. **統合テスト** - 実データで動作確認
  5. **Diff レビュー** - `git diff --staged`

- ✅ 全 check pass 後のみ commit

### プロンプト規格

- ✅ 各プロンプト開始時に「CRITICAL CONSTRAINTS」を明記
  ```
  CRITICAL CONSTRAINTS:
  1. All database operations must handle null/error responses
  2. One file change at a time; wait for approval between files
  3. TypeScript types must match schema exactly
  ```

- ✅ スキーマ/型定義をコンテキストに含める
- ✅ エージェントに「仮定列挙」「失敗モード列挙」を要求
- ✅ 「Wait for approval before proceeding」で待機指示

### 失敗時対応

- ✅ エラーが発生したら即座にロールバック `git revert <hash>`
- ✅ 何が失敗したか分析（ロジックエラー？仮定誤り？制約忘れ？）
- ✅ ルール更新または制約追加
- ✅ 再挑戦時は明示的なフィードバック付き

---

## 6. OWLight 特有の標準

### インターフェース駆動設計

- ✅ 以下のインターフェースは必ず実装:
  - `IAuthService` - 認証（Firebase / Supabase）
  - `IRagService` - RAG 検索（Vertex AI Search / Supabase pgvector）
  - `ILlmService` - LLM 蒸留（Gemini API）
  - `IKnowledgeRepository` - ナレッジストレージ（Supabase）

- ✅ 実装クラスは `src/infrastructure/` 配下
- ✅ DI Container で依存性管理

### 行動設計（5 フェーズ）

- ✅ Morning Ritual - 価値観チェック（スキップ不可）
- ✅ Personal Dashboard - 進捗＋コンテキスト表示
- ✅ Work Overlay - 意思決定時サポート
- ✅ Sanctuary - 緊急相談窓口
- ✅ Twilight Ritual - 退勤ボタン（自動ロック）

### ナレッジ管理

- ✅ Opt-out 型公開：ユーザーが「支援を受けた」→ 自動共有フロー
- ✅ Tiered Authority:
  - Gold: 行政官認定
  - Silver: ベテラン（2 年以上）投稿
  - Bronze: 新規投稿
- ✅ 自動蒸留は DLP 付き（住民情報マスク）

---

## 7. チェックリスト：コミット前

- [ ] `npm run type-check` → ゼロエラー
- [ ] `npm test` → 全 pass
- [ ] console.log なし
- [ ] any 型なし
- [ ] TODO コメントなし
- [ ] import は consistent
- [ ] エラーハンドリング完全
- [ ] null チェック完全
- [ ] DB error チェック実装
- [ ] `git diff --staged` で確認
- [ ] コミットメッセージは英語 + 接頭語

---

## 8. 参考資料

- [Supabase RLS ドキュメント](https://supabase.com/docs/guides/auth/row-level-security)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Gemini API エラーハンドリング](https://ai.google.dev/gemini-api/docs)
