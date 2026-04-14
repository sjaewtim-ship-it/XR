/**
 * Supabase 服务层
 * 封装所有 Supabase 数据库操作
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config';

// 类型定义
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

// Supabase 客户端（单例）
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  }
  return supabase;
}

// ============================================
// Members 操作
// ============================================

/**
 * 根据手机号查找会员
 */
export async function getMemberByPhone(phone: string): Promise<MemberRow | null> {
  const { data, error } = await getSupabase()
    .from('members')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = 没有找到行，这是正常的（会员不存在）
    throw error;
  }

  return data;
}

/**
 * 获取所有会员
 */
export async function getMembers(): Promise<MemberRow[]> {
  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
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

  // 同时写入记录
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
  // 先获取当前值
  const { data: current, error: fetchError } = await getSupabase()
    .from('members')
    .select('remain_count, total_count')
    .eq('id', memberId)
    .single();

  if (fetchError) throw fetchError;

  const newRemain = current.remain_count + addCount;
  const newTotal = current.total_count + addCount;

  const { data, error } = await getSupabase()
    .from('members')
    .update({
      remain_count: newRemain,
      total_count: newTotal,
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;

  // 写入记录
  await addRecord(memberId, 'recharge', addCount, 0, 'system');

  return data;
}

/**
 * 创建或充值（智能判断）
 * 如果手机号不存在 → 创建 +5次
 * 如果手机号已存在 → +5次
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
  // 先获取当前值
  const { data: current, error: fetchError } = await getSupabase()
    .from('members')
    .select('remain_count')
    .eq('id', memberId)
    .single();

  if (fetchError) throw fetchError;

  if (current.remain_count < 1) {
    throw new Error('余额不足，无法消费');
  }

  const { data, error } = await getSupabase()
    .from('members')
    .update({
      remain_count: current.remain_count - 1,
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;

  // 写入记录
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
  const { data: current, error: fetchError } = await getSupabase()
    .from('members')
    .select('remain_count, total_count')
    .eq('id', memberId)
    .single();

  if (fetchError) throw fetchError;

  // 如果是扣减，校验余额
  if (delta < 0 && current.remain_count + delta < 0) {
    throw new Error('余额不足，无法扣减');
  }

  const newRemain = current.remain_count + delta;
  const newTotal = Math.max(0, current.total_count + delta);

  const { data, error } = await getSupabase()
    .from('members')
    .update({
      remain_count: newRemain,
      total_count: newTotal,
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;

  // 写入记录
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
  const { error } = await getSupabase().from('records').insert({
    member_id: memberId,
    type,
    count_change: countChange,
    amount,
    operator,
  });

  if (error) {
    console.error('Failed to add record:', error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 获取会员的所有记录
 */
export async function getRecords(memberId: string): Promise<RecordRow[]> {
  const { data, error } = await getSupabase()
    .from('records')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
