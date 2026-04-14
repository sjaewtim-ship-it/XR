/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { Member, View } from './types';
import { getMemberLevel, maskPhone, dbRecordToDisplay } from './types';
import { getMemberByPhone, getMembers, createOrRechargeMember, consumeOnce, adjustCount, rechargeMember, getRecords } from './services/api';
import type { MemberRow, RecordRow } from './services/api';
import MemberManagement from './components/MemberManagement';
import MemberDetails from './components/MemberDetails';
import PackagePurchase from './components/PackagePurchase';
import MemberHome from './components/MemberHome';

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
  const [currentView, setCurrentView] = useState<View>('management');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // 全局 loading / toast 状态
  const [globalLoading, setGlobalLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Toast 自动消失
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

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
    const updated = await consumeOnce(memberId);
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
    const updated = await adjustCount(memberId, -subCount, 'merchant');
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

  const handleBack = () => {
    setCurrentView('management');
    setSelectedMember(null);
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
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

      {/* View Switcher for Demo Purposes */}
      <div className="fixed bottom-4 left-4 flex gap-2 z-[100] bg-surface-highest/80 backdrop-blur-md p-2 rounded-lg border border-primary/20">
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
        <button
          onClick={() => selectedMember && setCurrentView('home')}
          className={`px-3 py-1 text-[10px] rounded ${currentView === 'home' ? 'bg-primary text-background' : 'text-primary'}`}
        >
          用户端-首页
        </button>
      </div>
    </div>
  );
}
