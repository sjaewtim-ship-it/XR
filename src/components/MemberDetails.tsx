import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Star, Bolt, PlusCircle, MinusCircle, Wallet, Rocket, Award } from 'lucide-react';
import { Member, DisplayRecord, maskPhone } from '../types';
import { motion } from 'motion/react';

interface Props {
  member: Member;
  onBack: () => void;
  onConsumeOnce: (memberId: string) => Promise<Member | null>;
  onAddCount: (memberId: string, count: number) => Promise<Member | null>;
  onSubtractCount: (memberId: string, count: number) => Promise<Member | null>;
  onGetRecords: (memberId: string) => Promise<DisplayRecord[]>;
  onRecharge: (name: string, phone: string, count?: number) => Promise<Member>;
}

export default function MemberDetails({
  member,
  onBack,
  onConsumeOnce,
  onAddCount,
  onSubtractCount,
  onGetRecords,
  onRecharge,
}: Props) {
  const [records, setRecords] = useState<DisplayRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubtractModal, setShowSubtractModal] = useState(false);
  const [customCount, setCustomCount] = useState(5);
  const [subtractCount, setSubtractCount] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'recharge' | 'consume'>('all');

  useEffect(() => {
    onGetRecords(member.id).then(setRecords);
  }, [member.id, onGetRecords]);

  // 刷新记录
  const refreshRecords = () => {
    onGetRecords(member.id).then(setRecords);
  };

  // 消费 1 次
  const handleConsume = async () => {
    const updated = await onConsumeOnce(member.id);
    if (updated) refreshRecords();
  };

  // 增加次数
  const handleAdd = async () => {
    const updated = await onAddCount(member.id, customCount);
    if (updated) {
      setShowAddModal(false);
      setCustomCount(5);
      refreshRecords();
    }
  };

  // 扣减次数
  const handleSubtract = async () => {
    if (subtractCount < 1) return;
    const updated = await onSubtractCount(member.id, subtractCount);
    if (updated) {
      setShowSubtractModal(false);
      setSubtractCount(1);
      refreshRecords();
    }
  };

  // 过滤记录
  const filteredRecords = records.filter((r) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'recharge') return r.type === 'recharge' || r.type === 'gift';
    return r.type === 'consumption';
  });

  return (
    <div className="min-h-screen pb-24">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl flex items-center h-16 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center w-full max-w-4xl mx-auto relative">
          <ArrowLeft onClick={onBack} className="w-6 h-6 text-primary active:scale-95 duration-200 cursor-pointer" />
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary absolute left-1/2 -translate-x-1/2">会员详情 (商家端)</h1>
          <MoreVertical className="ml-auto w-5 h-5 text-primary/70 hover:opacity-80 transition-opacity cursor-pointer" />
        </div>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-6">
        {/* 会员信息卡片 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-surface-low rounded-xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl border border-primary/5">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-primary font-headline text-2xl font-bold">{member.name}</span>
                <span className="bg-secondary/20 text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold border border-secondary/30">
                  {member.level === 'Premium' ? '高级会员' : member.level === 'Experience' ? '体验官' : '普通会员'}
                </span>
              </div>
              <p className="text-on-surface-variant font-body text-sm tracking-widest">{maskPhone(member.phone)}</p>
            </div>
            <div className="relative z-10 mt-8 flex items-end gap-2">
              <div className="flex flex-col">
                <span className="text-on-surface-variant text-[10px] uppercase tracking-tighter">会员 ID</span>
                <span className="text-primary/40 font-headline text-xs">{member.id.slice(0, 8)}</span>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute right-6 top-6">
              <Star className="w-16 h-16 text-primary/10 fill-primary/10" />
            </div>
          </div>

          <div className="bg-surface rounded-xl p-6 flex flex-col items-center justify-center border border-primary/10 relative">
            <span className="text-on-surface-variant text-sm mb-2">剩余漫游次数</span>
            <div className="flex items-baseline gap-1">
              <span className="text-secondary font-headline text-6xl font-bold tracking-tighter">{member.remainingTimes}</span>
              <span className="text-secondary/60 text-lg font-bold">次</span>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="text-[10px] text-secondary/80">正常生效</span>
            </div>
          </div>
        </section>

        {/* 操作按钮 */}
        <section className="space-y-4">
          <button
            onClick={handleConsume}
            disabled={member.remainingTimes < 1}
            className="w-full h-24 bg-gradient-to-r from-accent to-secondary rounded-xl flex flex-col items-center justify-center shadow-[0_10px_40px_rgba(253,139,0,0.3)] active:scale-95 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <Bolt className="w-8 h-8 text-on-background fill-on-background" />
              <span className="text-on-background font-headline text-2xl font-black">
                {member.remainingTimes < 1 ? '余额不足' : '立即核销 1 次'}
              </span>
            </div>
            <span className="text-on-background/70 text-xs mt-1">XR 空间漫游标准体验</span>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-3 py-5 bg-surface-high rounded-xl border border-outline-variant/30 hover:bg-surface-highest transition-colors active:scale-95"
            >
              <PlusCircle className="w-5 h-5 text-primary" />
              <span className="font-bold text-on-surface">增加次数</span>
            </button>
            <button
              onClick={() => setShowSubtractModal(true)}
              className="flex items-center justify-center gap-3 py-5 bg-surface-high rounded-xl border border-outline-variant/30 hover:bg-surface-highest transition-colors active:scale-95"
            >
              <MinusCircle className="w-5 h-5 text-on-surface-variant" />
              <span className="font-bold text-on-surface">扣减次数</span>
            </button>
          </div>
        </section>

        {/* 记录列表 */}
        <section className="bg-surface-low rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="flex px-4 pt-4 border-b border-outline-variant/20">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 border-b-2 ${activeTab === 'all' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant/60'} font-bold text-sm relative`}
              >
                全部记录
              </button>
              <button
                onClick={() => setActiveTab('recharge')}
                className={`pb-3 border-b-2 ${activeTab === 'recharge' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant/60'} text-sm hover:text-on-surface transition-colors`}
              >
                充值记录
              </button>
              <button
                onClick={() => setActiveTab('consume')}
                className={`pb-3 border-b-2 ${activeTab === 'consume' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant/60'} text-sm hover:text-on-surface transition-colors`}
              >
                消费记录
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-outline text-sm">暂无记录</p>
              </div>
            ) : (
              filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-surface-highest/30 rounded-xl p-4 flex items-center justify-between border-l-4 ${
                    record.type === 'consumption' ? 'border-primary/50' : 'border-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      record.type === 'consumption' ? 'bg-primary/10' : 'bg-secondary/10'
                    }`}>
                      {record.type === 'recharge' && <Wallet className="w-5 h-5 text-secondary" />}
                      {record.type === 'consumption' && <Rocket className="w-5 h-5 text-primary" />}
                      {record.type === 'gift' && <Award className="w-5 h-5 text-secondary" />}
                    </div>
                    <div>
                      <div className="text-on-surface font-bold text-sm">{record.title}</div>
                      <div className="text-on-surface-variant text-[11px] mt-1">{record.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`${record.amount > 0 ? 'text-secondary' : 'text-primary'} font-headline font-bold text-lg`}>
                      {record.amount > 0 ? `+${record.amount}` : record.amount} {record.unit}
                    </div>
                    <div className="text-on-surface-variant text-xs">
                      {record.price !== undefined ? `¥${record.price.toLocaleString()}` : record.description}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* 增加次数弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-background/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-highest rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-4">增加次数</h3>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setCustomCount(Math.max(1, customCount - 1))}
                className="w-10 h-10 rounded-full bg-surface text-primary text-xl font-bold flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                value={customCount}
                onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-surface-low border-none rounded-xl h-12 text-center text-on-surface text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => setCustomCount(customCount + 1)}
                className="w-10 h-10 rounded-full bg-surface text-primary text-xl font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-surface text-on-surface font-bold"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 py-3 rounded-xl bg-primary text-background font-bold"
              >
                确认 +{customCount} 次
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 扣减次数弹窗 */}
      {showSubtractModal && (
        <div className="fixed inset-0 z-[200] bg-background/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-highest rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-4">扣减次数</h3>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setSubtractCount(Math.max(1, subtractCount - 1))}
                className="w-10 h-10 rounded-full bg-surface text-on-surface-variant text-xl font-bold flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                value={subtractCount}
                onChange={(e) => setSubtractCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-surface-low border-none rounded-xl h-12 text-center text-on-surface text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => setSubtractCount(subtractCount + 1)}
                className="w-10 h-10 rounded-full bg-surface text-on-surface-variant text-xl font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
            <p className="text-outline text-xs mb-6 text-center">当前可用：{member.remainingTimes} 次</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubtractModal(false)}
                className="flex-1 py-3 rounded-xl bg-surface text-on-surface font-bold"
              >
                取消
              </button>
              <button
                onClick={handleSubtract}
                disabled={subtractCount > member.remainingTimes}
                className="flex-1 py-3 rounded-xl bg-primary text-background font-bold disabled:opacity-40"
              >
                确认 -{subtractCount} 次
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/50 backdrop-blur-md px-4 py-2 rounded-full border border-primary/10 pointer-events-none opacity-50">
        <span className="text-primary font-headline font-black tracking-widest uppercase text-[10px]">XR SPACE CONTROL</span>
      </div>
    </div>
  );
}
