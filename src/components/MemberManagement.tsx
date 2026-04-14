import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, ChevronRight, UserPlus } from 'lucide-react';
import { Member, maskPhone } from '../types';
import { motion } from 'motion/react';

interface Props {
  onSelectMember: (member: Member) => void;
  onAddMember: () => void;
  fetchMembers: () => Promise<Member[]>;
  findMemberByPhone: (phone: string) => Promise<Member | null>;
}

export default function MemberManagement({ onSelectMember, onAddMember, fetchMembers, findMemberByPhone }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 初始拉取
  useEffect(() => {
    fetchMembers().then(setMembers);
  }, [fetchMembers]);

  // 搜索逻辑：前端过滤
  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return m.name.toLowerCase().includes(q) || m.phone.includes(q);
  });

  // 搜索按钮：按手机号精确查找
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMembers().then(setMembers);
      return;
    }
    // 尝试按手机号精确查找
    setIsSearching(true);
    try {
      const found = await findMemberByPhone(searchQuery.trim());
      if (found) {
        setMembers([found]);
      } else {
        // 精确查找无结果，回退到前端过滤
        fetchMembers().then((all) => {
          setMembers(all);
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  // 统计
  const totalCount = members.length;
  const todayConsume = 0; // 可从 records 表统计，暂留 0

  return (
    <div className="min-h-screen pb-24">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl flex items-center h-16 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] bg-gradient-to-b from-primary/10 to-transparent justify-center">
        <h1 className="font-headline font-bold text-lg tracking-tight text-primary">会员管理</h1>
        <div className="absolute right-4 flex items-center gap-4">
          <Filter className="w-5 h-5 text-primary/70 cursor-pointer" />
          <MoreVertical className="w-5 h-5 text-primary/70 cursor-pointer" />
        </div>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-outline" />
          </div>
          <input
            className="w-full bg-surface-low border-none rounded-xl py-4 pl-12 pr-16 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30 transition-all outline-none"
            placeholder="请输入姓名或手机号"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/20 hover:bg-primary/30 text-primary text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {isSearching ? '搜索中' : '搜索'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-surface-low to-surface px-5 py-6 rounded-xl border-l-4 border-primary shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <p className="text-on-surface-variant text-xs mb-2 font-medium">会员总数</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-headline font-bold text-primary">{totalCount}</span>
              <span className="text-xs text-primary/60 font-medium">人</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-surface-low to-surface px-5 py-6 rounded-xl border-l-4 border-secondary shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-secondary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <p className="text-on-surface-variant text-xs mb-2 font-medium">今日消费次数</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-headline font-bold text-secondary">{todayConsume}</span>
              <span className="text-xs text-secondary/60 font-medium">次</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="w-1 h-4 bg-secondary rounded-full" />
            会员列表
          </h2>
          <div className="text-xs text-outline flex items-center gap-1 cursor-pointer">
            最近消费时间
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-outline text-sm">暂无会员数据</p>
            <p className="text-outline/60 text-xs mt-2">请先在 Supabase 执行建表 SQL</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectMember(member)}
                className="bg-surface-low/50 backdrop-blur-md p-4 rounded-xl flex items-center gap-4 hover:bg-surface-high transition-colors cursor-pointer group border border-outline-variant/10"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-highest flex-shrink-0 flex items-center justify-center text-2xl">
                  {member.avatar ? (
                    <img
                      className="w-full h-full object-cover"
                      src={member.avatar}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{member.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-on-surface truncate">{member.name}</span>
                    {member.level !== 'Normal' && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                        member.level === 'Premium'
                          ? 'bg-secondary/10 text-secondary border-secondary/20'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {member.level === 'Premium' ? '高级会员' : '体验官'}
                      </span>
                    )}
                  </div>
                  <p className="text-outline text-xs font-medium">{maskPhone(member.phone)}</p>
                  <p className="text-outline/60 text-[10px] mt-0.5">
                    注册时间：{member.created_at ? new Date(member.created_at).toLocaleDateString('zh-CN') : '-'}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xs text-outline">剩余</span>
                    <span className="text-lg font-headline font-bold text-secondary">{member.remainingTimes}</span>
                    <span className="text-[10px] text-outline">次</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-outline text-[10px] font-medium tracking-widest uppercase">END OF LIST · XR DATA SYNCED</p>
        </div>
      </main>

      <button
        onClick={onAddMember}
        className="fixed right-6 bottom-24 w-14 h-14 bg-secondary text-on-background rounded-2xl shadow-[0_8px_20px_rgba(255,183,125,0.4)] flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <UserPlus className="w-6 h-6" />
      </button>
    </div>
  );
}
