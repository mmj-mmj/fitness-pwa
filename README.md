# 训练日志 PWA

一个适合 iPhone 添加到主屏幕使用的健身记录 Web App 骨架。

## 技术栈

- React + Vite
- PWA manifest + service worker
- localStorage 本地保存
- iPhone 底部 Tab 布局

## 目录说明

- `src/features/dashboard`: 首页，显示今日是否训练和最近一次训练
- `src/features/workout-entry`: 新增训练，一次训练可包含多个动作
- `src/features/history`: 按日期展示历史记录
- `src/features/stats`: 训练次数、总组数、常练动作等统计
- `src/features/settings`: 导出 JSON、导入 JSON、清空数据
- `src/lib`: 数据结构、本地存储、训练状态管理
- `public`: PWA manifest、service worker 和应用图标

## 下一步

## 打包安卓 APK

本项目已接入 Capacitor，并生成了 `android/` 原生项目。

### 在 GitHub 生成 APK

1. 打开 GitHub 仓库的 Actions。
2. 选择 `Build Android APK`。
3. 点击 `Run workflow`。
4. 等待任务完成后，在任务页面底部下载 `fitness-pwa-debug-apk`。
5. 解压后把 `app-debug.apk` 传到安卓手机安装。

安卓手机安装前需要允许当前文件管理器或浏览器“安装未知来源应用”。

### 在本机用 Android Studio 打包

1. 安装 Android Studio。
2. 运行 `npm run android:sync`。
3. 运行 `npm run android:open`。
4. 在 Android Studio 中选择 Build APK。

当前生成的是 debug APK，适合自己安装测试；如果要正式分发，需要配置 release 签名。

## Supabase 登录同步

项目已预留 Supabase 登录和云同步能力。没有配置 Supabase 时，App 会继续只使用本地数据。

需要准备：

1. 创建 Supabase 项目。
2. 在 Supabase SQL Editor 运行 `supabase/schema.sql`。
3. 在 Supabase Project Settings → API 复制 Project URL 和 anon public key。
4. 本地开发时复制 `.env.example` 为 `.env.local`，填入：

```txt
VITE_SUPABASE_URL=你的 Project URL
VITE_SUPABASE_ANON_KEY=你的 anon public key
```

5. GitHub Pages 部署时，在仓库 Settings → Secrets and variables → Actions → Variables 添加同名变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

同步逻辑：

- 未登录：继续保存到当前设备本地。
- 登录后：合并本地和云端训练记录，并上传本地记录。
- 新增、删除、导入、清空：登录状态下会同步到云端。
- 退出登录：本机数据仍会保留。

## 部署到 GitHub Pages

1. 在 GitHub 创建一个空仓库。
2. 推送本项目到 `main` 分支。
3. 打开仓库 Settings → Pages。
4. Source 选择 GitHub Actions。
5. 等待 `Deploy to GitHub Pages` 工作流完成。

完成后，GitHub 会给出 Pages 网址。用 iPhone Safari 打开后，可以添加到主屏幕。
