# OWLight_Bell_Notifications

## スキル概要

OWLight における **通知システム（Notifications）** の設計方針。
ベルアイコンによる「非同期通知」と、画面全体を使った「儀式（Rituals）」による「同期通知」を統合的に扱います。

- **Backend**: Supabase (`notifications` table + Realtime)
- **Frontend**: `Sidebar` (Badge), `AppShell` (Dropdown), `RitualModal`
- **Scope**: ユーザーへのフィードバック、業務連絡、システムアラート

---

## 1. データモデル

### notifications テーブル設計
現在の `users.id` (`text`型) に合わせ、外部キーを定義します。

```sql
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references users(id), -- text型 (suzuki_01 等)
  type       text not null,        -- 'system', 'approval', 'chat', 'ritual'
  priority   text default 'normal', -- 'high', 'normal', 'low'
  title      text not null,
  body       text,
  link_url   text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS: 本人のみアクセス可
alter table notifications enable row level security;
create policy "own_notifications" on notifications
  for all using (user_id = current_setting('app.current_user_id', true));
```

---

## 2. 通知の種類とUX

### A. ベル通知 (Async)
画面右上のベルアイコンに集約される通知。ユーザーの作業を中断させない。

- **承認依頼**: 「ナレッジ『XX』の承認依頼が届届いています」
- **システム**: 「インポート処理が完了しました」
- **チャット**: 「AIエージェントからの回答準備ができました」（長時間の処理時）

### B. 儀式・モーダル通知 (Sync / Rituals)
ユーザーの行動フローに介入し、マインドセットを切り替えるための通知。

- **Morning Ritual**:
  - ログイン時またはリセット時に起動。
  - 前日の振り返りを表示し、当日の意図（Intent）を設定させる。
- **Closing Ritual**:
  - ログアウト時または業務終了時に起動。
  - 1日の振り返りとスタンプ承認、ポイント獲得演出を行う。

---

## 3. 実装ガイドライン

### ベルアイコン実装 (Planned)
現在は未実装。`AppShell` のヘッダーに追加を推奨。

1. **Polling / Realtime**:
   - 初回ロード: 未読件数取得。
   - Realtime: `postgres_changes` を購読し、新規通知時にバッジ更新＋Toast表示。

2. **Toast連携**:
   - 重要な通知（High Priority）は、ベルへの格納と同時に `sonner` / `react-hot-toast` 等で画面隅にポップアップ表示する。

### 儀式実装 (Implemented)
`MorningRitual.tsx` および `ClosingRitual.tsx` として実装済み。

- **推奨**: 今後は、儀式内での入力内容（Intent/Reflection）を要約し、翌日の「ベル通知」としてフィードバックする（例：「昨日の目標は達成できましたか？」）ことで、SyncとAsyncの循環を作る。
## スキル概要

OWLight の画面右上などにある **ベルアイコン（通知アイコン）** に、  
リアルタイムで未読バッジと通知ドロップダウンを表示するための設計・実装方針。

- バックエンド: Supabase（PostgreSQL + Realtime）
- フロント: OWLight Web クライアント（React 等を想定）
- 通知対象: 画面内のベルアイコンのみ（ブラウザプッシュは対象外）

---

## データモデル

### notifications テーブル

Supabase（PostgreSQL）に通知テーブルを作成する。

```sql
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  type       text not null,        -- 'system', 'info', 'warning' など
  title      text not null,
  body       text,
  link_url   text,                 -- クリックで飛ぶURL（任意）
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- 行レベルセキュリティ（RLS）想定
alter table notifications enable row level security;

create policy "ユーザー本人のみ参照可"
  on notifications
  for select
  using (auth.uid() = user_id);

create policy "ユーザー本人のみ更新可"
  on notifications
  for update
  using (auth.uid() = user_id);
役割:

notifications に 1行 = 1件の通知 を保存

user_id に紐づけることで、ユーザーごとに通知を分離

is_read フラグで既読/未読を判定

通知生成フロー（サーバ側）
基本方針
OWLight バックエンドで何らかのイベントが起きたときに、
Supabase の notifications テーブルへ INSERT することで通知を発生させる。

例:

新しいお知らせを管理者が登録した

バッチ処理やインポート処理が完了した

エラー／警告系のシステム通知 など

擬似コード（Node/TypeScript想定）
ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  linkUrl?: string;
}) {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link_url: params.linkUrl ?? null,
  });

  if (error) {
    // ログ出力など
    console.error('failed to insert notification', error);
  }
}
フロントエンド（ベルアイコン）の挙動
1. 初期ロード時
ログイン後、画面を開いたタイミングで:

Supabase から未読件数を取得

ベルアイコンにバッジを表示

ドロップダウン用に直近の通知一覧を取得

例: 未読件数の取得
ts
const { data, error } = await supabase
  .from('notifications')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', currentUserId)
  .eq('is_read', false);

const unreadCount = data?.length ?? 0; // or use count
setUnreadCount(unreadCount);
例: 通知一覧の取得（最新20件など）
ts
const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', currentUserId)
  .order('created_at', { ascending: false })
  .limit(20);

setNotificationList(notifications);
2. Realtime での新規通知反映
Supabase Realtime（Postgres Changes）で notifications テーブルの INSERT を購読し、
該当ユーザー向け通知が来たらベルアイコンに即反映する。

ts
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${currentUserId}`,
    },
    (payload) => {
      const newNotification = payload.new;

      // 未読件数を+1
      setUnreadCount((prev) => prev + 1);

      // リストの先頭に追加
      setNotificationList((prev) => [newNotification, ...prev]);
    },
  )
  .subscribe();
filter を使うことで、ユーザー毎に通知を絞り込める

UIフレームワーク（React 等）では useEffect 内で subscribe / cleanup する形を想定

3. 既読処理
ユーザーが:

ベルのドロップダウンを開いたタイミング

ある通知をクリックしたタイミング

上記いずれかで is_read = true に更新する。

ts
async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (!error) {
    setNotificationList((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
  }
}
「ドロップダウンを開いたら全件既読」にする場合は user_id 条件で一括 UPDATE する。

UI ルール（簡易）
ベルアイコン

未読件数が 1 件以上ある場合：

アイコン右上に赤丸バッジ（最大表示値は 99+ などに制限）

ドロップダウン

最新順で通知を並べる

各通知に:

タイトル（必須）

短い本文 or サマリ

時刻

クリック時に link_url へ遷移（ある場合）

未読と既読の見た目

未読: 太字 or 背景色を薄くハイライト

既読: 通常表示

このスキルの前提・非対象
対応:

画面内のベルアイコンと通知ドロップダウン

ユーザー毎の通知ストリーム

Supabase Realtime を使ったリアルタイム反映

非対応（このスキルの範囲外）:

ブラウザ / モバイルの OS レベルのプッシュ通知（必要なら FCM 等を別途導入）

メール通知やLINE連携などの外部チャネル