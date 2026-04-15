import { useState, useEffect } from 'react';
import { LogOut, Lock } from 'lucide-react';
import { signIn, signOut, getCurrentUser, onAuthStateChange, User } from '../services/auth';
import { motion } from 'motion/react';

interface Props {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(email.trim(), password);
      
      if (result.error) {
        setError(result.error.message);
      } else if (result.user) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface-low/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-outline-variant/20">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-on-background" />
            </div>
            <h1 className="font-headline font-bold text-2xl text-primary mb-2">
              XR 科普漫游空间
            </h1>
            <p className="text-on-surface-variant text-sm">会员管理平台 - 商家登录</p>
          </div>

          {/* login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-on-surface mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
                className="w-full bg-surface-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-surface-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-sm"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs px-4 py-3 rounded-xl"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-primary text-on-background font-bold py-4 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-outline text-[10px]">
              仅限授权人员使用 · 账号由管理员分配
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
