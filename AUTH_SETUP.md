# 认证功能改造指南

## 一、需要修改的文件列表

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/services/auth.ts` | ✅ 新建 | 认证服务层（登录/登出/状态监听） |
| `src/components/Login.tsx` | ✅ 新建 | 登录页面组件 |
| `src/App.tsx` | 🔄 修改 | 添加认证状态管理、路由守卫、登出按钮 |
| `src/services/supabase.ts` | 🔄 修改 | `consumeOnce` 添加 operator 参数 |
| `src/services/api.ts` | 🔄 修改 | `consumeOnce` 接口签名更新 |
| `src/config/sql.sql` | ✅ 新建 | RLS 配置 SQL 脚本 |
| `.env.example` | 🔄 修改 | 添加 Auth 说明注释 |

---

## 二、登录页实现方案

### 位置：`src/components/Login.tsx`

**功能特性：**
- 邮箱 + 密码输入框
- 登录表单验证
- 错误提示
- Loading 状态
- 响应式设计（移动端适配）

**UI 设计：**
- 居中卡片布局
- 品牌 Logo + 标题
- 渐变背景
- Motion 动画效果

**代码要点：**
```tsx
// 登录处理
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const result = await signIn(email, password);
  if (result.user) {
    onLoginSuccess(result.user);
  }
};
```

---

## 三、路由守卫方案

### 位置：`src/App.tsx`

**实现逻辑：**

```tsx
// 1. 初始化时检查登录状态
useEffect(() => {
  getCurrentUser().then(({ user }) => {
    setCurrentUser(user);
    setAuthLoading(false);
  });

  // 监听 auth 状态变化
  const unsubscribe = onAuthStateChange((user) => {
    setCurrentUser(user);
  });

  return () => unsubscribe();
}, []);

// 2. Loading 状态
if (authLoading) {
  return <LoadingScreen />;
}

// 3. 未登录 → 显示登录页
if (!currentUser) {
  return <Login onLoginSuccess={handleLoginSuccess} />;
}

// 4. 已登录 → 显示主应用
return <MainApp />;
```

**保护范围：**
- `management` - 会员列表 ✅
- `details` - 会员详情 ✅
- `purchase` - 套餐购买 ✅
- `home` - C 端首页 ✅

---

## 四、Supabase RLS SQL

### 位置：`src/config/sql.sql`

**执行步骤：**

1. 登录 Supabase 控制台
2. 进入 **SQL Editor**
3. 复制粘贴 `sql.sql` 内容
4. 点击 **Run** 执行

**SQL 内容：**

```sql
-- 启用 members 表 RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 允许认证用户访问 members
CREATE POLICY "authenticated_users_members"
ON members FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 启用 records 表 RLS
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- 允许认证用户访问 records
CREATE POLICY "authenticated_users_records"
ON records FOR ALL TO authenticated
USING (true) WITH CHECK (true);
```

**效果：**
- 未登录用户：无法访问任何数据（返回空或 403）
- 已登录用户：正常读写数据
- 匿名访问：被 RLS 策略拒绝

---

## 五、本地验证步骤

### Step 1: 配置环境变量

```bash
# 复制 .env.example 为 .env
cp .env.example .env

# 编辑 .env，填入你的 Supabase 配置
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx
VITE_APP_ENV=dev
```

### Step 2: 在 Supabase 启用 Email/Password 登录

1. 登录 Supabase 控制台
2. 进入 **Authentication** → **Providers**
3. 确保 **Email** 已启用
4. 关闭 **Enable signup**（不允许注册）

### Step 3: 手动创建测试账号

1. 进入 **Authentication** → **Users**
2. 点击 **Add user** → **Create new user**
3. 填写：
   - Email: `admin@example.com`
   - Password: `test123456`
   - Auto Confirm User: ✅ 勾选
4. 点击 **Create user**

### Step 4: 执行 RLS SQL

1. 进入 **SQL Editor**
2. 打开 `src/config/sql.sql` 复制内容
3. 粘贴并执行
4. 确认显示 "Success"

### Step 5: 启动开发服务器

```bash
npm install
npm run dev
```

### Step 6: 验证流程

| 步骤 | 预期结果 |
|------|----------|
| 1. 打开 http://localhost:5173 | 显示登录页 |
| 2. 输入错误密码 | 显示错误提示 |
| 3. 输入正确账号密码 | 登录成功，跳转到管理页 |
| 4. 点击右上角退出按钮 | 退出登录，回到登录页 |
| 5. 刷新页面 | 保持登录状态（Session 持久化） |
| 6. 打开浏览器 DevTools → Application → Local Storage | 看到 `sb-xxxxx-auth-token` |
| 7. 在 Supabase 查看 records 表 | operator 字段显示当前用户邮箱 |

### Step 7: 验证 RLS

1. 打开浏览器无痕模式
2. 访问应用 URL
3. 应该看到登录页（无法绕过）
4. 打开 Network 面板
5. 尝试直接调用 Supabase API（无 token）
6. 应该返回 403 或空数据

---

## 六、生产环境部署

### Vercel 环境变量配置

在 Vercel 项目设置中添加：

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | 生产环境 Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | 生产环境 Anon Key |
| `VITE_APP_ENV` | `prod` |

### Supabase 生产环境配置

1. 在生产环境 Supabase 项目中重复 Step 2-4
2. 创建正式用户账号
3. 建议开启 **Email Confirmation**（可选）

---

## 七、常见问题

### Q1: 登录后刷新页面丢失状态？
A: Supabase Auth 默认将 session 存储在 localStorage，刷新后会自动恢复。检查是否被浏览器清除。

### Q2: RLS 执行后无法访问数据？
A: 确认已登录。可用以下 SQL 检查策略：
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Q3: 如何修改 operator 显示为用户名而非邮箱？
A: 修改 `src/App.tsx` 中的 `getCurrentOperator()`：
```tsx
const getCurrentOperator = (): string => {
  return currentUser?.user_metadata?.name || currentUser?.email || 'unknown';
};
```

### Q4: 如何添加多个管理员？
A: 在 Supabase Authentication → Users 中逐个创建即可。所有认证用户拥有相同权限。

---

## 八、安全建议

1. **定期更换密码**：在 Supabase 后台重置用户密码
2. **限制 IP 访问**：使用 Supabase Database → Settings → IP Allowlist
3. **开启审计日志**：Supabase Settings → Audit Log
4. **备份数据**：Supabase Settings → Backups → Enable Daily Backup
