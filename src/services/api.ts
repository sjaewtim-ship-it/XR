/**
 * API 层 - 业务接口封装
 * 所有页面只调用此层，不直接调用 supabase.ts
 * 
 * ✅ 所有函数返回 null 而非 throw，页面层自行处理
 */

import * as supabaseService from './supabase';
import type { MemberRow, RecordRow } from './supabase';

export type { MemberRow, RecordRow };

// ============================================
// 会员相关
// ============================================

export async function getMemberByPhone(phone: string): Promise<MemberRow | null> {
  return supabaseService.getMemberByPhone(phone);
}

export async function getMembers(): Promise<MemberRow[]> {
  return supabaseService.getMembers();
}

/**
 * ✅ 核心支付入口
 * 不存在 → 创建 +5次
 * 已存在 → +5次
 */
export async function createOrRechargeMember(
  name: string,
  phone: string,
  count?: number
): Promise<{ member: MemberRow | null; isNew: boolean }> {
  return supabaseService.createOrRechargeMember(name, phone, count);
}

export async function rechargeMember(
  memberId: string,
  addCount: number = 5
): Promise<MemberRow | null> {
  return supabaseService.rechargeMember(memberId, addCount);
}

export async function consumeOnce(memberId: string): Promise<MemberRow | null> {
  return supabaseService.consumeOnce(memberId);
}

export async function adjustCount(
  memberId: string,
  delta: number,
  operator?: string
): Promise<MemberRow | null> {
  return supabaseService.adjustCount(memberId, delta, operator);
}

// ============================================
// 记录相关
// ============================================

export async function getRecords(memberId: string): Promise<RecordRow[]> {
  return supabaseService.getRecords(memberId);
}
