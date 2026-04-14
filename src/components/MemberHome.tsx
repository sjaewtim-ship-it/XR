import { useState, useEffect } from 'react';
import { ShoppingCart, ChevronRight, PlusCircle, Rocket, Verified, Monitor, Star } from 'lucide-react';
import { Member, DisplayRecord, maskPhone } from '../types';
import { motion } from 'motion/react';

interface Props {
  member: Member;
  onBuyPackage: () => void;
  onGetRecords: (memberId: string) => Promise<DisplayRecord[]>;
  onRefreshMember: () => Promise<void>;
}

export default function MemberHome({ member, onBuyPackage, onGetRecords, onRefreshMember }: Props) {
  const [records, setRecords] = useState<DisplayRecord[]>([]);

  useEffect(() => {
    onGetRecords(member.id).then(setRecords);
  }, [member.id, onGetRecords]);

  // 购买后刷新
  const handleBuyAndRefresh = async () => {
    onBuyPackage();
  };

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl flex items-center h-16 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] bg-gradient-to-b from-primary/10 to-transparent justify-center">
        <h1 className="font-headline font-bold text-lg tracking-tight text-primary">XR科普漫游空间</h1>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto">
        <section className="relative mt-4">
          <div className="rounded-xl p-6 overflow-hidden bg-gradient-to-br from-[#1F4E8C] to-[#0B1E3D] shadow-2xl relative">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary/20 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-3xl font-headline font-bold text-on-surface">{member.name}</h2>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                  </div>
                  <p className="text-on-surface-variant font-medium tracking-wider">{maskPhone(member.phone)}</p>
                </div>
                <div className="bg-surface-highest/40 backdrop-blur-md px-3 py-1 rounded-full border border-outline-variant/30">
                  <span className="text-xs font-bold text-primary tracking-widest uppercase">{member.level}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-on-surface-variant text-sm mb-1 font-medium">当前可用漫游次数</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-headline font-black text-secondary leading-none">{member.remainingTimes}</span>
                  <span className="text-secondary font-bold">次</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary/80 mt-2 bg-primary/10 w-fit px-3 py-1.5 rounded-lg border border-primary/10">
                <Star className="w-3 h-3 fill-primary" />
                <span>探索者计划：高级空间访问权限已开启</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 px-2">
          <button
            onClick={handleBuyAndRefresh}
            className="w-full bg-secondary text-on-background font-bold py-5 rounded-xl shadow-[0_8px_20px_-4px_rgba(253,139,0,0.4)] active:scale-95 transition-all duration-200 text-lg flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-6 h-6 fill-on-background" />
            购买套餐
          </button>
          <p className="text-center text-on-surface-variant/60 text-xs mt-4">新用户首单立减 ¥50 · 支持数字地球通兑</p>
        </section>

        <section className="mt-12 mb-10">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              使用记录
            </h3>
            <button className="text-primary text-sm font-semibold flex items-center">
              全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {records.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-outline text-sm">暂无使用记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.slice(0, 3).map((record) => (
                <div key={record.id} className="bg-surface-low rounded-xl p-5 border border-transparent hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        record.type === 'recharge' ? 'bg-secondary/20' : 'bg-primary/20'
                      }`}>
                        {record.type === 'recharge' ? (
                          <PlusCircle className="w-6 h-6 text-secondary fill-secondary/10" />
                        ) : (
                          <Rocket className="w-6 h-6 text-primary fill-primary/10" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">{record.title}</h4>
                        <p className="text-xs text-on-surface-variant mt-1">{record.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-headline font-bold ${record.amount > 0 ? 'text-secondary' : 'text-primary'}`}>
                        {record.amount > 0 ? `+${record.amount}` : record.amount}
                      </p>
                      <p className="text-xs text-on-surface-variant/40">{record.amount > 0 ? `¥${record.price ?? 0}` : '已完成'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 mb-20 px-2">
          <h3 className="text-sm font-bold text-on-surface-variant mb-4 uppercase tracking-widest">会员专属权益</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-highest/20 p-4 rounded-xl border border-outline-variant/10">
              <Verified className="w-5 h-5 text-secondary mb-2" />
              <h5 className="text-sm font-bold">优先排队</h5>
              <p className="text-[10px] text-on-surface-variant mt-1">热门项目无需等待</p>
            </div>
            <div className="bg-surface-highest/20 p-4 rounded-xl border border-outline-variant/10">
              <Monitor className="w-5 h-5 text-secondary mb-2" />
              <h5 className="text-sm font-bold">8K 画质</h5>
              <p className="text-[10px] text-on-surface-variant mt-1">极致视听体验解锁</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
