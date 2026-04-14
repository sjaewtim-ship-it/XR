/**
 * Supabase SQL 建表语句
 * 
 * 使用方法：
 * 1. 登录 https://supabase.com/dashboard
 * 2. 进入项目 → SQL Editor
 * 3. 复制以下全部 SQL 粘贴执行
 */

export const CREATE_TABLES_SQL = `
-- ============================================
-- 表1: members（会员表）
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  remain_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：手机号查询优化
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

-- ============================================
-- 表2: records（记录表）
-- ============================================
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('recharge', 'consume')),
  count_change INTEGER NOT NULL,
  amount NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  operator VARCHAR(50) DEFAULT 'system'
);

-- 索引：按会员查询记录
CREATE INDEX IF NOT EXISTS idx_records_member_id ON records(member_id);
-- 索引：按时间倒序
CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at DESC);

-- ============================================
-- 可选：RLS 策略（Row Level Security）
-- 开发阶段可以先关闭，上线后开启
-- ============================================
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE records ENABLE ROW LEVEL SECURITY;
-- 
-- -- 允许所有人读取（公开项目）
-- CREATE POLICY "Allow read all" ON members FOR SELECT USING (true);
-- CREATE POLICY "Allow read all" ON records FOR SELECT USING (true);
-- 
-- -- 允许所有人写入（开发阶段，生产环境请改为认证用户）
-- CREATE POLICY "Allow insert all" ON members FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow insert all" ON records FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow update all" ON members FOR UPDATE USING (true);

-- ============================================
-- 测试数据（可选，可删除）
-- ============================================
-- INSERT INTO members (name, phone, remain_count, total_count) VALUES
--   ('林木深', '13800009928', 24, 30),
--   ('李美琳', '15900002284', 12, 12);
`;

export default CREATE_TABLES_SQL;
