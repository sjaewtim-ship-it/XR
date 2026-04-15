/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Member, View } from './types';
import { getMemberLevel, maskPhone, dbRecordToDisplay } from './types';
import { getMemberByPhone, getMembers, createOrRechargeMember, consumeOnce, adjustCount, rechargeMember, getRecords } from './services/api';
import { supabase } from './services/supabase';
import type { MemberRow, RecordRow } from './services/api';
import { getCurrentUser, signOut, onAuthStateChange, User } from './services/auth';
import MemberManagement from './components/MemberManagement';
import MemberDetails from './components/MemberDetails';
import PackagePurchase from './components/PackagePurchase';
import MemberHome from './components/MemberHome';
import Login from './components/Login';

// 工具函数：将后端 MemberRow 转为前端 Member（处理 null）
function rowToMember(row: MemberRow | null): Member | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    level: getMemberLevel(row.total_count),
    remainingTimes: row.remain_count,
    totalCount: row.total_count,
    created_at: row.created_at,
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('purchase');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // 认证状态
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // 全局 loading / toast 状态
  const [globalLoading, setGlobalLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 初始化：检查登录状态 + 监听 auth 变化
  useEffect(() => {
    // 初始检查
    getCurrentUser().then(({ user }) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    // 监听 auth 状态变化（登录/登出）
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Toast 自动消失
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 处理登录成功
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('management'); // 登录后跳转到管理页
    showToast('登录成功', 'success');
  };

  // 处理登出
  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    setCurrentView('purchase'); // 回到首页
    showToast('已退出登录', 'success');
  };

  // 获取当前用户邮箱（用于 operator）
  const getCurrentOperator = (): string => {
    return currentUser?.email || 'unknown';
  };

  // 拉取所有会员
  const fetchMembers = useCallback(async (): Promise<Member[]> => {
    setGlobalLoading(true);
    const rows = await getMembers();
    setGlobalLoading(false);
    return rows.map(rowToMember);
  }, []);

  // 根据手机号查找会员
  const handleFindMemberByPhone = useCallback(async (phone: string): Promise<Member | null> => {
    setGlobalLoading(true);
    const row = await getMemberByPhone(phone);
    setGlobalLoading(false);
    if (row) {
      const member = rowToMember(row);
      setSelectedMember(member);
      return member;
    }
    return null;
  }, []);

  // 选择会员（进入详情）
  const handleSelectMember = useCallback((member: Member) => {
    setSelectedMember(member);
    setCurrentView('details');
  }, []);

  // 新建/充值会员（✅ 支付入口：不接支付，直接创建/充值）
  const handleCreateOrRecharge = useCallback(async (name: string, phone: string, count?: number) => {
    setGlobalLoading(true);
    const result = await createOrRechargeMember(name, phone, count);
    setGlobalLoading(false);

    if (!result.member) {
      showToast('操作失败，请重试', 'error');
      return null;
    }

    const member = rowToMember(result.member);
    setSelectedMember(member);
    showToast(result.isNew ? `创建成功！赠送 ${count || 5} 次` : `充值成功！+${count || 5} 次`, 'success');
    return member;
  }, [showToast]);

  // 消费 1 次
  const handleConsumeOnce = useCallback(async (memberId: string): Promise<Member | null> => {
    setGlobalLoading(true);
    const updated = await consumeOnce(memberId, getCurrentOperator());
    setGlobalLoading(false);

    if (!updated) {
      showToast('消费失败，可能余额不足', 'error');
      return null;
    }

    const member = rowToMember(updated);
    setSelectedMember(member);
    showToast('消费成功！-1 次', 'success');
    return member;
  }, [showToast]);

  // 增加次数
  const handleAddCount = useCallback(async (memberId: string, addCount: number): Promise<Member | null> => {
    setGlobalLoading(true);
    const updated = await rechargeMember(memberId, addCount);
    setGlobalLoading(false);

    if (!updated) {
      showToast('增加失败', 'error');
      return null;
    }

    const member = rowToMember(updated);
    setSelectedMember(member);
    showToast(`增加成功！+${addCount} 次`, 'success');
    return member;
  }, [showToast]);

  // 扣减次数
  const handleSubtractCount = useCallback(async (memberId: string, subCount: number): Promise<Member | null> => {
    setGlobalLoading(true);
    const updated = await adjustCount(memberId, -subCount, getCurrentOperator());
    setGlobalLoading(false);

    if (!updated) {
      showToast('扣减失败，可能余额不足', 'error');
      return null;
    }

    const member = rowToMember(updated);
    setSelectedMember(member);
    showToast(`扣减成功！-${subCount} 次`, 'success');
    return member;
  }, [showToast]);

  // 获取会员记录
  const handleGetRecords = useCallback(async (memberId: string) => {
    const rows = await getRecords(memberId);
    return rows.map(dbRecordToDisplay);
  }, []);

  // 刷新今日消费次数
  const handleRefreshTodayCount = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('records')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'consume')
      .gte('created_at', `${today}T00:00:00`);
    return count || 0;
  }, []);

  const handleBack = () => {
    setCurrentView('management');
    setSelectedMember(null);
  };

  // Auth loading 状态
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录：显示登录页
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 已登录：显示主应用
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* 顶部用户信息 + 登出按钮 */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 bg-surface-low/80 backdrop-blur-md px-3 py-2 rounded-xl border border-outline-variant/20">
        <span className="text-xs text-on-surface-variant truncate max-w-[150px]">
          {currentUser.email}
        </span>
        <button
          onClick={handleLogout}
          className="p-1.5 hover:bg-secondary/20 rounded-lg transition-colors"
          title="退出登录"
        >
          <LogOut className="w-4 h-4 text-on-surface-variant" />
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-xl shadow-2xl text-sm font-bold transition-all ${
          toast.type === 'success' 
            ? 'bg-secondary/90 text-background' 
            : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Global Loading */}
      {globalLoading && (
        <div className="fixed inset-0 z-[150] bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface-highest px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm">处理中...</p>
          </div>
        </div>
      )}

      {currentView === 'management' && (
        <MemberManagement
          onSelectMember={handleSelectMember}
          onAddMember={() => setCurrentView('purchase')}
          fetchMembers={fetchMembers}
          findMemberByPhone={handleFindMemberByPhone}
          refreshTodayCount={handleRefreshTodayCount}
        />
      )}
      {currentView === 'details' && selectedMember && (
        <MemberDetails
          member={selectedMember}
          onBack={handleBack}
          onConsumeOnce={handleConsumeOnce}
          onAddCount={handleAddCount}
          onSubtractCount={handleSubtractCount}
          onGetRecords={handleGetRecords}
          onRecharge={handleCreateOrRecharge}
          onActionSuccess={handleRefreshTodayCount}
        />
      )}
      {currentView === 'purchase' && (
        <PackagePurchase
          onBack={handleBack}
          onCreateOrRecharge={handleCreateOrRecharge}
        />
      )}
      {currentView === 'home' && selectedMember && (
        <MemberHome
          member={selectedMember}
          onBuyPackage={() => setCurrentView('purchase')}
          onGetRecords={handleGetRecords}
          onRefreshMember={async () => {
            const row = await getMemberByPhone(selectedMember.phone);
            if (row) setSelectedMember(rowToMember(row));
          }}
        />
      )}

      {/* View Switcher for Demo Purposes - 已隐藏，需开发时可取消注释 */}
      {/* <div className="fixed bottom-4 left-4 flex gap-2 z-[100] bg-surface-highest/80 backdrop-blur-md p-2 rounded-lg border border-primary/20">
        <button
          onClick={() => setCurrentView('management')}
          className={`px-3 py-1 text-[10px] rounded ${currentView === 'management' ? 'bg-primary text-background' : 'text-primary'}`}
        >
          商家端-列表
        </button>
        <button
          onClick={() => selectedMember && setCurrentView('details')}
          className={`px-3 py-1 text-[10px] rounded ${currentView === 'details' ? 'bg-primary text-background' : 'text-primary'}`}
        >
          商家端-详情
        </button>
        <button
          onClick={() => setCurrentView('purchase')}
          className={`px-3 py-1 text-[10px] rounded ${currentView === 'purchase' ? 'bg-primary text-background' : 'text-primary'}`}
        >
          用户端-购买
        </button>
      </div> */}
    </div>
  );
}
