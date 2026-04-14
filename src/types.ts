export interface Member {
  id: string;
  name: string;
  phone: string;
  level: 'Premium' | 'Experience' | 'Normal';
  remainingTimes: number;
  avatar: string;
  lastVisit: string;
}

export interface Record {
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
