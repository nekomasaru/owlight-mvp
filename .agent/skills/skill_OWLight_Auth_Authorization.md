# OWLight_Auth_Authorization

## スキル概要

行政向けサービス OWLight における **認証（Authentication）** と **認可（Authorization / 権限制御）** の設計方針。
MVPフェーズ（独自ID/Mock）と本番フェーズ（Supabase Auth）の2段階で実装を進めます。

- **MVP Phase (Current)**:
  - 簡易認証: `UserContext` によるMockユーザー切り替え、または独自IDベースの認証。
  - ユーザーID: `text` 型（例: `suzuki_01`）を使用し、既存システムとの連携を想定。
- **Production Phase**:
  - 認証基盤: Supabase Auth（MFA対応）
  - ID管理: `uuid` ベースへの移行、またはMappingテーブルの使用。

---

## 1. 認証設計 (Authentication)

### Phase 1: MVP Architecture (Current)
現状の `UserContext.tsx` と `users` テーブルに基づきます。

- **ログイン**: 特定のURLパラメータ（例: `/?uid=suzuki_01`）または開発者メニューからの切り替え。
- **セッション**: React Context (`UserContext`) 内で状態管理。
- **データ同期**: 初回ロード時に `api/users` 経由でDBから最新のプロファイルを取得。

### Phase 2: Production Roadmap (Supabase Auth)
本番運用時には以下の構成へ移行します。

#### ログイン方式
1. **メール + パスワード**
   - Supabase Auth API (`signInWithPassword`) を使用。
2. **多要素認証 (TOTP)**
   - 行政セキュリティ要件を満たすため、管理職や重要データアクセス時に必須化。
   - Google Authenticator 等を利用。

---

## 2. 認可設計 (Authorization)

### ロールベースアクセス制御 (RBAC)
OWLightでは以下のロールを定義し、UIおよびAPIで権限を制御します。

| ロール | ID例 | 権限範囲 |
| :--- | :--- | :--- |
| **New Hire (新人)** | `new_hire` | 参照: 公開ナレッジのみ<br>アクション: メンターモード有効 |
| **Veteran (中堅)** | `veteran` | 参照: 部署内ナレッジ<br>アクション: ナレッジ作成・編集 |
| **Manager (管理職)** | `manager` | 参照: 全ナレッジ、統計データ<br>アクション: ナレッジ承認、ユーザー管理 |

### RLS (Row Level Security) 実装方針
Supabase上のデータはRLSで保護します。
※ MVPでは `service_role` キー回避を行っていますが、順次以下のポリシーを適用します。

```sql
-- 自分のデータのみ読み書き可能
create policy "users_own_data" on users
  for all using (id = auth.uid()::text); 
  -- 注意: Phase 2では auth.uid() と users.id の型変換または紐付けが必要
```

---

## 3. 実装・移行ガイド

### `UserContext` の役割
このコンポーネントが「認証のアダプター」として機能します。
将来的にバックエンドが Supabase Auth に変わっても、`useUser()` フックのインターフェース（`user` オブジェクト、`role` プロパティ）を維持することで、UIコンポーネントへの影響を最小限に抑えます。

### 監査ログ (Audit)
認可に伴う重要な操作（ユーザー権限変更、ドキュメント削除等）は、必ずバックエンドAPIを経由し、操作ログを記録する設計とします。
## スキル概要

行政向けサービス OWLight における **認証（Authentication）** と  
**認可（Authorization / 権限制御）** を Supabase を中心に実現するための設計・実装方針。

- 認証: Supabase Auth（メール+パスワード、MFA/TOTP、招待メール、パスワードリセット）
- 認可: PostgreSQL Row Level Security（RLS）で行レベル制御
- 目的: 行政向けとして妥当なセキュリティと運用性を、最小構成で確保する

---

## 認証（Authentication）設計

### 1. ログイン方式

- 採用:
  - メールアドレス + パスワード（基本）
  - 多要素認証（TOTP: Google Authenticator 等）をオプション／ロール別で必須化
- Supabase 機能:
  - `signUp`, `signInWithPassword`, `signOut` などの Auth API を利用

#### ログイン画面フロー（OWLight）

1. ユーザーがメール＋パスワードを入力して送信
2. フロントエンドが `supabase.auth.signInWithPassword({ email, password })` を呼び出す
3. 成功時:
   - Supabase が JWT を発行
   - フロントは JWT を持ったセッションとして扱い、以後のAPI呼び出しに利用
4. 失敗時:
   - エラーメッセージを表示（「メールアドレスまたはパスワードが間違っています」など）

### 2. 多要素認証（MFA / TOTP）

- 採用方式:
  - TOTP（Time-based One-Time Password）
  - ユーザーが Google Authenticator / Authy などに QRコードで登録する一般的な方式
- Supabase 機能:
  - MFA/TOTP をサポートしており、
    - シークレット生成
    - QRコードの提供
    - `challenge` / `verify` による検証を API 経由で実行可能

#### 有効化フロー（ユーザー設定画面）

1. ユーザーが「多要素認証を有効化」ボタンを押す
2. サーバ側で「MFAシークレット」を生成し、QRコードを表示
3. ユーザーが Google Authenticator でQRをスキャン
4. ユーザーがアプリに表示された6桁コードを入力
5. Supabase の MFA API でコードを検証
6. 成功したら、そのユーザーに対して「MFA有効化」をフラグ付け

#### ログイン時のフロー

1. メール＋パスワードで一次認証成功
2. MFA有効ユーザーの場合:
   - 6桁コード入力画面を表示
   - Supabase の `mfa.verify()`（`mfa.challenge()` + `verify`）でコードを検証
3. 検証OKなら、最終的なセッションを確立

### 3. パスワードリセット / 変更

#### パスワードリセット（「忘れた場合」）

1. ログイン画面の「パスワードをお忘れですか？」リンク
2. メールアドレス入力後、`supabase.auth.resetPasswordForEmail(email, { redirectTo })` を呼ぶ
3. Supabase がパスワードリセットメールを送信
4. ユーザーがメール内リンクをクリック → OWLight の専用画面に遷移
5. 新しいパスワードを入力し、`supabase.auth.updateUser({ password: ... })` で更新

#### パスワード変更（ログイン済みユーザー）

- プロファイル画面で「現在のパスワード + 新しいパスワード」を入力させ、  
  `updateUser` を使ってパスワードを更新するフローを実装

### 4. ユーザー招待（メールから初回ログイン）

- 管理者が OWLight 管理画面でメールアドレスを入力し、「ユーザー招待」ボタンを押す
- サーバ側で Supabase Admin API の `auth.admin.inviteUserByEmail(email)` を呼び出す
- Supabase が招待メールを送信
- 職員はメール内リンクから初回ログイン画面にアクセスし、パスワード設定（＋MFA設定）を行う

---

## 認可（Authorization / 権限制御）設計

### 1. 基本コンセプト

- 認証 = 「誰であるか」（Supabase Auth）
- 認可 = 「何にアクセスできるか」（RLS）
- OWLight では以下を典型要件とする：
  - 自治体テナント単位でデータを分離（他自治体のデータは見えない）
  - ロール（職員 / 管理者 / 外部アカウント）による権限差を設ける

### 2. プロファイル・ロール情報

Supabase側に、ユーザープロファイルテーブルを持つ。

```sql
create table if not exists profiles (
  id           uuid primary key,          -- auth.users.id と一致
  tenant_id    uuid not null,            -- 自治体ID
  role         text not null,            -- 'admin', 'staff', 'viewer' など
  display_name text,
  created_at   timestamptz not null default now()
);
利用者がログインすると、auth.uid() で profiles.id と紐付けて tenant_id / role を参照する。

3. RLS の基本設定手順
対象テーブルで RLS を有効化

sql
alter table documents enable row level security;
テナント分離ポリシー（行レベル）

sql
create policy "tenant_isolation"
  on documents
  for select using (
    tenant_id = (
      select tenant_id from profiles
      where id = auth.uid()
    )
  );
これにより、documents テーブルは

documents.tenant_id と

profiles.tenant_id（ログインユーザーの所属自治体）
が一致する行だけ見えるようになる。

ロール別権限ポリシー（例）

読み取り（職員・管理者はOK）

sql
create policy "read_docs_staff_admin"
  on documents
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and tenant_id = documents.tenant_id
        and role in ('staff', 'admin')
    )
  );
書き込み（管理者のみOK）

sql
create policy "write_docs_admin_only"
  on documents
  for insert, update, delete using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and tenant_id = documents.tenant_id
        and role = 'admin'
    )
  );
4. 通知テーブルへのRLS適用（ベルアイコン連動）
通知テーブルの例：

sql
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  type       text not null,
  title      text not null,
  body       text,
  link_url   text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "notifications_owner_only"
  on notifications
  for select using (user_id = auth.uid());

create policy "notifications_owner_update"
  on notifications
  for update using (user_id = auth.uid());
これにより、ユーザーは 自分宛ての通知だけを取得・更新可能 になる。

Supabase Realtime（Postgres Changes）側でも filter: user_id=eq.{auth.uid()} を組み合わせることで、
行レベル＋リアルタイムの両方で安全性を確保できる。

実装上のポイント
認証:

Supabase Auth のメール＋パスワード基盤を使い、ログイン画面・パスワードリセット・招待フローを OWLight側UIで包む。

MFA(TOTP)は管理者・特定ロールのユーザーに対して必須化すると行政向けに相性が良い。

認可:

まずは「テナントID（自治体単位）での分離」を最優先。

次にロール（admin/staffなど）＋テーブルごとのRLSポリシーで権限差をつける。

アプリ側での if 判定に頼り切らず、DBレベルでアクセス制御を強制する。

ログ・監査:

認証・認可に関する操作（招待、ロール変更、RLSに守られた更新）については、
別テーブルまたは外部ログ基盤に監査ログを残すことを推奨。