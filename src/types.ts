/**
 * 类型定义 - 与 Supabase 数据模型对齐
 */

// 会员信息（兼容前后端）
export interface Member {
  id: string;
  name: string;
  phone: string;
  level: 'Premium' | 'Experience' | 'Normal';
  remainingTimes: number;
  totalCount?: number;
  avatar?: string;
  lastVisit?: string;
  created_at?: string;
}

// 操作记录
export interface Record {
  id: string;
  member_id: string;
  type: 'recharge' | 'consume';
  count_change: number;
  amount: number;
  created_at: string;
  operator: string;
}

// 兼容旧 Record 类型（用于 UI 展示转换）
export interface DisplayRecord {
  id: string;
  type: 'recharge' | 'consumption' | 'gift';
  title: string;
  date: string;
  amount: number;
  unit: string;
  price?: number;
  description?: string;
}

export type View = 'management' | 'details' | 'purchase' | 'home';

// ============================================
// 工具函数：将 DB Record 转为 DisplayRecord
// ============================================
export function dbRecordToDisplay(record: Record): DisplayRecord {
  const date = new Date(record.created_at);
  const dateStr = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (record.type === 'recharge') {
    return {
      id: record.id,
      type: 'recharge',
      title: record.operator === 'system' ? '系统充值' : '手动充值',
      date: dateStr,
      amount: record.count_change,
      unit: '次',
      price: record.amount || undefined,
    };
  }

  return {
    id: record.id,
    type: 'consumption',
    title: '核销消费',
    date: dateStr,
    amount: record.count_change,
    unit: '次',
    description: '商家端核销',
  };
}

// ============================================
// 工具函数：根据次数判断会员等级
// ============================================
export function getMemberLevel(totalCount: number): Member['level'] {
  if (totalCount >= 20) return 'Premium';
  if (totalCount >= 5) return 'Experience';
  return 'Normal';
}

// ============================================
// 工具函数：手机号脱敏
// ============================================
export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + ' **** ' + phone.slice(-4);
}
