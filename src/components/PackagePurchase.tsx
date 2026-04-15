import { useState } from 'react';
import { ArrowLeft, Phone, User, CheckCircle, Info, Wallet } from 'lucide-react';
import { Member } from '../types';
import { motion } from 'motion/react';

interface Props {
  onBack: () => void;
  onCreateOrRecharge: (name: string, phone: string, count?: number) => Promise<Member>;
}

// 手机号校验
function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/\s/g, '');
  if (!cleaned) return '请输入手机号';
  if (!/^1[3-9]\d{9}$/.test(cleaned)) return '手机号格式不正确';
  return null;
}

function validateName(name: string): string | null {
  if (!name.trim()) return '请输入姓名';
  if (name.trim().length < 2) return '姓名至少 2 个字符';
  return null;
}

export default function PackagePurchase({ onBack, onCreateOrRecharge }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    // 校验
    const nameErr = validateName(name);
    const phoneErr = validatePhone(phone);
    setNameError(nameErr);
    setPhoneError(phoneErr);
    if (nameErr || phoneErr) return;

    setIsSubmitting(true);
    try {
      await onCreateOrRecharge(name.trim(), phone.replace(/\s/g, ''), 5);
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-secondary" />
          </div>
          <h2 className="text-2xl font-headline font-bold text-primary mb-2">购买成功！</h2>
          <p className="text-on-surface-variant mb-2">{name} 已获得 5 次体验</p>
          <p className="text-on-surface-variant/60 text-sm mb-8">手机号：{phone}</p>
          <button
            onClick={onBack}
            className="bg-primary text-background font-bold px-8 py-4 rounded-xl"
          >
            返回首页
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="flex items-center h-16 px-4 w-full bg-background/80 backdrop-blur-xl fixed top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)] bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center w-full justify-between relative">
          <ArrowLeft onClick={onBack} className="w-6 h-6 text-primary active:scale-95 duration-200 cursor-pointer absolute left-0" />
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary w-full text-center">购买套餐</h1>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-6">
        <div className="relative h-48 w-full rounded-xl overflow-hidden mb-8 shadow-2xl">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQNALYHeTyxGgsbCtm1CnKcEkT4sN_ojQg0hthvQc1VmCA1y0qPi8jcP_LLwn9_mWYyM9j22It2WHj7OURtJy_KcLu8373YfqGTOGu43R82HejECPeHgFBl-S0T2h3VidsKpjmOqvU9SVT-_3mqJgBuu4k_gguyeWZ_7p7_acFSKayr6kTLBjZB4sWA18iteLGCF9skyohujwXDYOFiVqzUzraAxBwvmiJ2zPbo6oqLo1sd03-SaMNo0mI9Z8YEeESz4kQiZukGLau"
            alt="XR Space"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6">
            <h2 className="font-headline text-3xl font-bold text-primary tracking-tight">探索无限可能</h2>
            <p className="text-on-surface-variant text-sm mt-1">开启您的数字科普策展之旅</p>
          </div>
        </div>

        <section className="bg-surface-low/40 backdrop-blur-md p-6 rounded-xl border border-primary/5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="w-1 h-5 bg-secondary rounded-full" />
              会员信息
            </h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-on-surface-variant ml-1">姓名</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  className={`w-full bg-surface-low border-none rounded-xl h-12 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-1 transition-all outline-none ${
                    nameError ? 'ring-2 ring-red-500/50' : 'focus:ring-primary'
                  }`}
                  placeholder="请输入姓名"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(null); }}
                />
              </div>
              {nameError && <p className="text-red-400 text-xs ml-1">{nameError}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-on-surface-variant ml-1">手机号</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  className={`w-full bg-surface-low border-none rounded-xl h-12 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-1 transition-all outline-none ${
                    phoneError ? 'ring-2 ring-red-500/50' : 'focus:ring-primary'
                  }`}
                  placeholder="请输入手机号"
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 11)); setPhoneError(null); }}
                />
              </div>
              {phoneError && <p className="text-red-400 text-xs ml-1">{phoneError}</p>}
            </div>
          </div>
        </section>

        <section className="bg-surface-low/40 backdrop-blur-md p-6 rounded-xl border border-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-secondary rounded-full" />
            <h3 className="text-lg font-bold text-on-surface">XR科普漫游空间-5次卡套餐</h3>
          </div>
          <div className="bg-surface-lowest/50 rounded-xl p-5 space-y-4">
            <p className="text-sm text-primary font-medium">包含体验项目：</p>
            <ul className="grid grid-cols-1 gap-3">
              {['埃菲尔铁塔云游记', '恐龙时代大冒险', '嫦娥探月大冒险', '深海寻宝大冒险', '万里长城大作战', '烈火逃生大冒险'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-on-surface-variant text-sm">
                  <span className="text-secondary font-bold">✔</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="pt-4 mt-2 border-t border-outline-variant/30 flex items-start gap-2">
              <Info className="w-4 h-4 text-outline mt-0.5" />
              <p className="text-[12px] text-outline leading-relaxed">说明：主题任选，每次扣减1次。本套餐一经售出，支持线下体验使用。</p>
            </div>
          </div>
        </section>

        <section className="flex items-end justify-between px-2 pt-4">
          <div className="space-y-1">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest">套餐价格</p>
            <div className="flex items-baseline gap-1">
              <span className="text-secondary font-headline text-2xl font-bold">¥</span>
              <span className="text-secondary font-headline text-5xl font-extrabold tracking-tighter">198</span>
            </div>
          </div>
          <div className="text-right pb-1">
            <div className="inline-flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#a9c7ff]" />
              <span className="text-primary text-[12px] font-bold">长期有效</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 w-full bg-background/90 backdrop-blur-lg z-50 border-t border-primary/10 h-24 flex items-center px-6 pb-safe shadow-[0_-10px_40px_rgba(11,30,61,0.5)]">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-6">
          <div className="hidden sm:block">
            <p className="text-outline text-xs">实付金额</p>
            <p className="text-secondary font-headline font-bold text-xl">¥198.00</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-accent to-secondary text-on-background font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(253,139,0,0.3)] active:scale-95 transition-all duration-200 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? '处理中...' : (
              <>
                立即支付
                <Wallet className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
