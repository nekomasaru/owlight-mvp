-- ============================================================
-- OWLight Initial User Seed Data
-- Execute this AFTER 001_initial_schema.sql
-- ============================================================

-- Seed initial users (matching current Firebase data)
insert into users (id, name, department, role, stamina, max_stamina, mentor_mode, points, thanks_count, time_saved_minutes) values
  ('tanaka-001', '田中課長', '総務部', 'admin', 100, 100, false, 500, 25, 180),
  ('sato-002', '佐藤係長', '福祉課', 'reviewer', 80, 100, false, 320, 18, 120),
  ('suzuki-003', '鈴木主任', '市民課', 'contributor', 100, 100, true, 150, 8, 45)
on conflict (id) do update set
  name = excluded.name,
  department = excluded.department,
  role = excluded.role;

-- Seed sample knowledge (for testing)
insert into knowledge_base (
  title, content, category, trust_tier, source_type, visibility, 
  created_by, approval_status, tags
) values
  (
    '生活保護申請の基本フロー',
    '生活保護の申請は、まず相談員との面談から始まります。必要書類は身分証明書、収入証明、預金通帳のコピーです。審査期間は通常14日以内ですが、複雑なケースは30日まで延長されることがあります。',
    '福祉',
    1, -- Gold
    'official',
    'public',
    'sato-002',
    'approved',
    ARRAY['生活保護', '申請', '手続き']
  ),
  (
    '窓口対応のコツ：高齢者編',
    '高齢者の方への対応では、ゆっくり大きな声で話すこと、専門用語を避けること、必要に応じて筆談を活用することが重要です。佐藤係長からの経験談：「焦らず、相手のペースに合わせることが信頼につながります」',
    '接客',
    2, -- Silver
    'mentor_validated',
    'public',
    'suzuki-003',
    'approved',
    ARRAY['接客', '高齢者', 'コミュニケーション']
  ),
  (
    '書類の保管期限について',
    '各種書類の保管期限は法律で定められています。詳細は総務部の書類管理規程を参照してください。',
    '総務',
    3, -- Bronze
    'user_submission',
    'public',
    'suzuki-003',
    'pending',
    ARRAY['書類', '保管', '規程']
  )
on conflict do nothing;

-- ============================================================
-- Seed Complete!
-- ============================================================
