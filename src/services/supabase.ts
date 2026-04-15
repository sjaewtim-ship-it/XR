/**
 * Supabase 服务层
 * 封装所有 Supabase 数据库操作
 * 
 * 修复说明：
 * - 所有 .single() 已改为 .maybeSingle()（避免 406 错误）
 * - 所有 error 改为 console.error + return（不抛异常到 React）
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// 环境变量读取 + 安全校验
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_PROJECT') || supabaseKey.includes('YOUR_ANON')) {
  console.error('❌ Supabase 环境变量未配置或仍为占位符，请检查 .env 文件');
}

// Supabase 客户端（单例）
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ============================================
// 类型定义
// ============================================
export interface MemberRow {
  id: string;
  name: string;
  phone: string;
  remain_count: number;
  total_count: number;
  created_at: string;
}

export interface RecordRow {
  id: string;
  member_id: string;
  type: 'recharge' | 'consume';
  count_change: number;
  amount: number;
  created_at: string;
  operator: string;
}

// ============================================
// Members 操作
// ============================================

/**
 * 根据手机号查找会员
 * ✅ 已修复：使用 maybeSingle() 避免 406 错误
 */
export async function getMemberByPhone(phone: string): Promise<MemberRow | null> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    console.error('[getMemberByPhone] 查询失败:', error.message);
    return null;
  }

  return data;
}

/**
 * 获取所有会员
 */
export async function getMembers(): Promise<MemberRow[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getMembers] 查询失败:', error.message);
    return [];
  }
  return data || [];
}

/**
 * 创建会员（默认赠送 5 次）
 */
export async function createMember(
  name: string,
  phone: string,
  count: number = 5
): Promise<MemberRow | null> {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name,
      phone,
      remain_count: count,
      total_count: count,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[createMember] 创建失败:', error.message);
    return null;
  }

  // 同时写入记录（不阻塞主流程）
  if (data) {
    addRecord(data.id, 'recharge', count, 0, 'system'); // 创建时 operator 保持 system
  }

  return data;
}

/**
 * 充值 - 给已有会员增加次数
 * ✅ 已修复：使用 maybeSingle()
 */
export async function rechargeMember(
  memberId: string,
  addCount: number = 5
): Promise<MemberRow | null> {
  const { data: current, error: fetchError } = await supabase
    .from('members')
    .select('remain_count, total_count')
    .eq('id', memberId)
    .maybeSingle();

  if (fetchError) {
    console.error('[rechargeMember] 查询失败:', fetchError.message);
    return null;
  }

  if (!current) {
    console.error('[rechargeMember] 会员不存在');
    return null;
  }

  const newRemain = current.remain_count + addCount;
  const newTotal = current.total_count + addCount;

  const { data, error } = await supabase
    .from('members')
    .update({
      remain_count: newRemain,
      total_count: newTotal,
    })
    .eq('id', memberId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[rechargeMember] 更新失败:', error.message);
    return null;
  }

  // 写入记录（不阻塞主流程）- operator 由上层传入，这里保持 system 作为默认
  addRecord(memberId, 'recharge', addCount, 0, 'system');

  return data;
}

/**
 * 创建或充值（智能判断）
 * ✅ 核心支付入口：不接支付，直接创建/充值
 */
export async function createOrRechargeMember(
  name: string,
  phone: string,
  count: number = 5
): Promise<{ member: MemberRow | null; isNew: boolean }> {
  // 1. 根据手机号查询会员（maybeSingle，不会抛 406）
  const existing = await getMemberByPhone(phone);

  if (existing) {
    // 2. 已存在 → 充值 +count
    const member = await rechargeMember(existing.id, count);
    return { member, isNew: false };
  } else {
    // 3. 不存在 → 新建 +count
    const member = await createMember(name, phone, count);
    return { member, isNew: true };
  }
}

/**
 * 消费一次（扣减 1 次）
 * ✅ 已修复：使用 maybeSingle()
 */
export async function consumeOnce(memberId: string, operator: string = 'system'): Promise<MemberRow | null> {
  const { data: current, error: fetchError } = await supabase
    .from('members')
    .select('remain_count')
    .eq('id', memberId)
    .maybeSingle();

  if (fetchError) {
    console.error('[consumeOnce] 查询失败:', fetchError.message);
    return null;
  }

  if (!current) {
    console.error('[consumeOnce] 会员不存在');
    return null;
  }

  if (current.remain_count < 1) {
    console.warn('[consumeOnce] 余额不足');
    return null;
  }

  const { data, error } = await supabase
    .from('members')
    .update({
      remain_count: current.remain_count - 1,
    })
    .eq('id', memberId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[consumeOnce] 更新失败:', error.message);
    return null;
  }

  addRecord(memberId, 'consume', -1, 0, operator);

  return data;
}

/**
 * 调整次数（可正可负）
 * ✅ 已修复：使用 maybeSingle()
 */
export async function adjustCount(
  memberId: string,
  delta: number,
  operator: string = 'system'
): Promise<MemberRow | null> {
  const { data: current, error: fetchError } = await supabase
    .from('members')
    .select('remain_count, total_count')
    .eq('id', memberId)
    .maybeSingle();

  if (fetchError) {
    console.error('[adjustCount] 查询失败:', fetchError.message);
    return null;
  }

  if (!current) {
    console.error('[adjustCount] 会员不存在');
    return null;
  }

  // 如果是扣减，校验余额
  if (delta < 0 && current.remain_count + delta < 0) {
    console.warn('[adjustCount] 余额不足');
    return null;
  }

  const newRemain = current.remain_count + delta;
  const newTotal = Math.max(0, current.total_count + delta);

  const { data, error } = await supabase
    .from('members')
    .update({
      remain_count: newRemain,
      total_count: newTotal,
    })
    .eq('id', memberId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[adjustCount] 更新失败:', error.message);
    return null;
  }

  addRecord(
    memberId,
    delta > 0 ? 'recharge' : 'consume',
    delta,
    0,
    operator
  );

  return data;
}

// ============================================
// Records 操作
// ============================================

/**
 * 添加记录（静默失败，不阻断 UI）
 */
async function addRecord(
  memberId: string,
  type: 'recharge' | 'consume',
  countChange: number,
  amount: number,
  operator: string
): Promise<void> {
  const { error } = await supabase.from('records').insert({
    member_id: memberId,
    type,
    count_change: countChange,
    amount,
    operator,
  });

  if (error) {
    console.error('[addRecord] 写入失败:', error.message);
  }
}

/**
 * 获取会员的所有记录
 */
export async function getRecords(memberId: string): Promise<RecordRow[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getRecords] 查询失败:', error.message);
    return [];
  }
  return data || [];
}
