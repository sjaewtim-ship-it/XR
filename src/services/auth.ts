/**
 * 认证服务层 - 封装 Supabase Auth
 */

import { supabase } from './supabase';

/**
 * 登录 - 使用邮箱密码登录
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[signIn] 登录失败:', error.message);
    return { user: null, error };
  }

  return { user: data.user, error: null };
}

/**
 * 登出
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[signOut] 登出失败:', error.message);
    return { error };
  }

  return { error: null };
}

/**
 * 获取当前会话和用户
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[getSession] 获取会话失败:', error.message);
    return { session: null, error };
  }

  return { session, error: null };
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser() {
  const { session } = await getSession();
  return { user: session?.user ?? null, error: null };
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.subscription.unsubscribe();
  };
}

/**
 * 检查是否已登录
 */
export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getCurrentUser();
  return !!user;
}

// 导出 Supabase User 类型
export type { User } from '@supabase/supabase-js';
