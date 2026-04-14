/**
 * 应用配置 - 环境管理
 * 注：Supabase 配置已迁移至 services/supabase.ts 直接读取环境变量
 */

export type Env = 'dev' | 'prod';

export const env: Env = (import.meta.env.VITE_APP_ENV as Env) || 'dev';

// API 基础配置（供其他服务使用）
export const apiConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// 环境信息
export const environment = {
  env,
  isDev: env === 'dev',
  isProd: env === 'prod',
};
