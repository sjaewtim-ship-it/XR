/**
 * API 层 - 业务接口封装
 * 所有页面只调用此层，不直接调用 supabase.ts
 */

import * as supabaseService from './supabase';
import type { MemberRow, RecordRow } from './supabase';

// 导出类型供页面使用
export type { MemberRow, RecordRow };

// ============================================
// 会员相关
// ============================================

/**
 * 根据手机号查找会员
 */
export async function getMemberByPhone(phone: string): Promise<MemberRow | null> {
  return supabaseService.getMemberByPhone(phone);
}

/**
 * 获取所有会员
 */
export async function getMembers(): Promise<MemberRow[]> {
  return supabaseService.getMembers();
}

/**
 * 创建或充值（智能判断）
 * 不存在 → 创建 +5次
 * 已存在 → +5次
 */
export async function createOrRechargeMember(
  name: string,
  phone: string,
  count?: number
): Promise<{ member: MemberRow; isNew: boolean }> {
  return supabaseService.createOrRechargeMember(name, phone, count);
}

/**
 * 直接充值（针对已有会员）
 */
export async function rechargeMember(
  memberId: string,
  addCount: number = 5
): Promise<MemberRow> {
  return supabaseService.rechargeMember(memberId, addCount);
}

/**
 * 消费一次
 */
export async function consumeOnce(memberId: string): Promise<MemberRow> {
  return supabaseService.consumeOnce(memberId);
}

/**
 * 调整次数（可正可负）
 */
export async function adjustCount(
  memberId: string,
  delta: number,
  operator?: string
): Promise<MemberRow> {
  return supabaseService.adjustCount(memberId, delta, operator);
}

// ============================================
// 记录相关
// ============================================

/**
 * 获取会员记录
 */
export async function getRecords(memberId: string): Promise<RecordRow[]> {
  return supabaseService.getRecords(memberId);
}
