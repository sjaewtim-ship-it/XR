/**
 * 应用配置 - 环境管理
 */

export type Env = 'dev' | 'prod';

export const env: Env = (import.meta.env.VITE_APP_ENV as Env) || 'dev';

// Supabase 配置
// 请在使用前替换为你自己的 Supabase 项目 URL 和 anon key
// 获取地址：https://supabase.com/dashboard → 你的项目 → Settings → API
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY',
};

// API 基础配置
export const apiConfig = {
  baseURL: supabaseConfig.url + '/rest/v1',
  headers: {
    apikey: supabaseConfig.anonKey,
    Authorization: `Bearer ${supabaseConfig.anonKey}`,
    'Content-Type': 'application/json',
  },
};

// 环境信息
export const environment = {
  env,
  isDev: env === 'dev',
  isProd: env === 'prod',
};
