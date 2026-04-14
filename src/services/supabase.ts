/**
 * Supabase 服务层
 * 封装所有 Supabase 数据库操作
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// 环境变量读取 + 安全校验
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_PROJECT') || supabaseKey.includes('YOUR_ANON')) {
  throw new Error('Supabase 环境变量未配置或仍为占位符，请检查 .env 文件');
}

// Supabase 客户端（单例）
export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// 连接验证（仅开发环境）
// ============================================
(async function verifyConnection() {
  if (import.meta.env.VITE_APP_ENV === 'prod') return;
  try {
    const { data, error } = await supabase.from('members').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('⚠️ Supabase 连接警告:', error.message);
      console.warn('请确认已在 Supabase 项目中建好 members 表');
    } else {
      console.log('✅ Supabase 连接成功 | URL:', supabaseUrl);
    }
  } catch {
    console.warn('⚠️ Supabase 连接失败，请检查网络和配置');
  }
})();

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
 */
export async function getMemberByPhone(phone: string): Promise<MemberRow | null> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
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

  if (error) throw error;
  return data || [];
}

/**
 * 创建会员（默认赠送 5 次）
 */
export async function createMember(
  name: string,
  phone: string,
  count: number = 5
): Promise<MemberRow> {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name,
      phone,
      remain_count: count,
      total_count: count,
    })
    .select()
    .single();

  if (error) throw error;

  await addRecord(data.id, 'recharge', count, 0, 'system');

  return data;
}

/**
 * 充值 - 给已有会员增加次数
 */
export async function rechargeMember(
  memberId: string,
  addCount: number = 5
): Promise<MemberRow> {
  const { data: current, error: fetchError } = await supabase
    .from('members')
    .select('remain_count, total_count')
    .eq('id', memberId)
    .single();

  if (fetchError) throw fetchError;

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
    .single();

  if (error) throw error;

  await addRecord(memberId, 'recharge', addCount, 0, 'system');

  return data;
}

/**
 * 创建或充值（智能判断）
 */
export async function createOrRechargeMember(
  name: string,
  phone: string,
  count: number = 5
): Promise<{ member: MemberRow; isNew: boolean }> {
  const existing = await getMemberByPhone(phone);

  if (existing) {
    const member = await rechargeMember(existing.id, count);
    return { member, isNew: false };
  } else {
    const member = await createMember(name, phone, count);
    return { member, isNew: true };
  }
}

/**
 * 消费一次（扣减 1 次）
 */
export async function consumeOnce(memberId: string): Promise<MemberRow> {
  const { data: current, error: fetchError } = await supabase
    .from('members')
    .select('remain_count')
    .eq('id', memberId)
    .single();

  if (fetchError) throw fetchError;

  if (current.remain_count < 1) {
    throw new Error('余额不足，无法消费');
  }

  const { data, error } = await supabase
    .from('members')
    .update({
      remain_count: current.remain_count - 1,
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;

  await addRecord(memberId, 'consume', -1, 0, 'system');

  return data;
}

/**
 * 调整次数（可正可负）
 */
export async function adjustCount(
  memberId: string,
  delta: number,
  operator: string = 'system'
): Promise<MemberRow> {
  const { data: current, error: fetchError } = await supabase
    .from('members')
    .select('remain_count, total_count')
    .eq('id', memberId)
    .single();

  if (fetchError) throw fetchError;

  if (delta < 0 && current.remain_count + delta < 0) {
    throw new Error('余额不足，无法扣减');
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
    .single();

  if (error) throw error;

  await addRecord(
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
 * 添加记录
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
    console.error('Failed to add record:', error);
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

  if (error) throw error;
  return data || [];
}
