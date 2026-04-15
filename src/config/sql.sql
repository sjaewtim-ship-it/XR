-- ============================================
-- Supabase RLS (Row Level Security) 配置 SQL
-- 用于保护 members 和 records 表
-- 仅允许 authenticated 用户访问
-- ============================================

-- 1. 启用 members 表的 RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 2. 创建策略：允许所有认证用户读写 members
CREATE POLICY "authenticated_users_members"
ON members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. 启用 records 表的 RLS
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- 4. 创建策略：允许所有认证用户读写 records
CREATE POLICY "authenticated_users_records"
ON records
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 使用说明：
-- 1. 在 Supabase 控制台 → SQL Editor 执行以上 SQL
-- 2. 确保 Auth 已启用 Email/Password 登录方式
-- 3. 在 Supabase 控制台 → Authentication → Users 手动添加用户
-- ============================================

-- 可选：查看现有策略
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 可选：禁用 RLS（开发调试用，生产环境不要执行）
-- ALTER TABLE members DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE records DISABLE ROW LEVEL SECURITY;
