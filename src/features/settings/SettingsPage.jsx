import { PageHeader } from "../../components/PageHeader.jsx";
import { useRef, useState } from "react";
import { exportWorkouts, importWorkouts } from "../../lib/storage.js";

export function SettingsPage({ auth, workoutStore }) {
  const fileInput = useRef(null);
  const [message, setMessage] = useState("");
  const [showDangerActions, setShowDangerActions] = useState(false);

  function downloadJson() {
    const content = exportWorkouts(workoutStore.workouts);
    const filename = `训练日志-${new Date().toISOString().slice(0, 10)}.json`;

    if (window.webkit?.messageHandlers?.fileExport) {
      window.webkit.messageHandlers.fileExport.postMessage({ filename, content });
      setMessage("已打开导出面板。");
      return;
    }

    if (window.AndroidFileExport?.shareJson) {
      window.AndroidFileExport.shareJson(filename, content);
      setMessage("已打开导出面板。");
      return;
    }

    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("已导出 JSON 文件。");
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      workoutStore.replaceWorkouts(importWorkouts(text));
      setMessage("导入成功。");
    } catch (error) {
      setMessage(error.message || "导入失败。");
    } finally {
      event.target.value = "";
    }
  }

  function clearData() {
    if (!window.confirm("确定清空所有训练数据吗？登录状态下也会清空云端数据。")) return;
    workoutStore.clearWorkouts();
    setMessage("已清空训练数据。");
  }

  return (
    <section className="page">
      <PageHeader title="我的" description="账号同步、导出备份和数据管理。" />
      <AuthPanel auth={auth} syncState={workoutStore.syncState} onSyncNow={workoutStore.syncNow} />
      <div className="settings-actions">
        <button className="primary-button" type="button" onClick={downloadJson}>导出 JSON</button>
        <button className="secondary-button" type="button" onClick={() => fileInput.current?.click()}>导入 JSON</button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleImport} />
      {message ? <p className="form-message">{message}</p> : null}
      <section className="panel">
        <h2>数据说明</h2>
        <p className="empty-text">未登录时数据只保存在当前设备本地。登录后会自动合并本地和云端记录；换手机登录同一账号即可同步。</p>
      </section>
      <section className="panel danger-zone">
        <button
          className="danger-zone-toggle"
          type="button"
          onClick={() => setShowDangerActions((value) => !value)}
          aria-expanded={showDangerActions}
        >
          数据高级操作
        </button>
        {showDangerActions ? (
          <div className="danger-zone-actions">
            <p>清空会删除本机训练数据；登录状态下也会同步清空云端数据。</p>
            <button className="danger-button" type="button" onClick={clearData}>清空全部训练数据</button>
          </div>
        ) : null}
      </section>
    </section>
  );
}

function AuthPanel({ auth, syncState, onSyncNow }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  async function handleAuth(action) {
    if (!email.trim() || !password) {
      setAuthMessage("请填写邮箱和密码。");
      return;
    }

    if (action === "sign-up" && !inviteCode.trim()) {
      setAuthMessage("注册需要填写邀请码。");
      return;
    }

    setBusy(true);
    setAuthMessage("");

    try {
      if (action === "sign-up") {
        await auth.signUp(email.trim(), password, inviteCode);
        setAuthMessage("注册请求已提交。如果开启了邮箱验证，请先去邮箱确认。");
      } else {
        await auth.signIn(email.trim(), password);
        setAuthMessage("登录成功，正在同步。");
      }
    } catch (error) {
      setAuthMessage(error.message || "操作失败。");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setAuthMessage("");

    try {
      await auth.signOut();
      setAuthMessage("已退出账号，本机数据仍会保留。");
    } catch (error) {
      setAuthMessage(error.message || "退出失败。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel auth-panel">
      <div className="panel-head">
        <div>
          <h2>账号同步</h2>
          <p>{syncState.message}</p>
        </div>
        <span className={`sync-badge ${syncState.status}`}>{formatSyncStatus(syncState.status)}</span>
      </div>

      {!auth.isCloudConfigured ? (
        <div className="auth-form">
          <p className="empty-text">当前安装包还没有写入 Supabase 配置，输入框可以正常操作；配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重新打包，登录和注册会连接云同步。</p>
          <label>
            <span>邮箱</span>
            <input autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>
          <label>
            <span>密码</span>
            <input autoComplete="current-password" minLength="6" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" />
          </label>
          <label>
            <span>邀请码</span>
            <input autoComplete="off" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="仅注册时需要" />
          </label>
          <div className="auth-actions">
            <button className="primary-button" type="button" onClick={() => handleAuth("sign-in")} disabled={busy}>登录</button>
            <button className="secondary-button" type="button" onClick={() => handleAuth("sign-up")} disabled={busy}>注册</button>
          </div>
        </div>
      ) : auth.user ? (
        <div className="auth-account">
          <strong>{auth.user.email}</strong>
          <div className="auth-actions">
            <button className="secondary-button" type="button" onClick={onSyncNow} disabled={busy}>立即同步</button>
            <button className="secondary-button" type="button" onClick={handleSignOut} disabled={busy}>退出登录</button>
          </div>
        </div>
      ) : (
        <div className="auth-form">
          <label>
            <span>邮箱</span>
            <input autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>
          <label>
            <span>密码</span>
            <input autoComplete="current-password" minLength="6" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" />
          </label>
          <label>
            <span>邀请码</span>
            <input autoComplete="off" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="仅注册时需要" />
          </label>
          <div className="auth-actions">
            <button className="primary-button" type="button" onClick={() => handleAuth("sign-in")} disabled={busy}>登录</button>
            <button className="secondary-button" type="button" onClick={() => handleAuth("sign-up")} disabled={busy}>注册</button>
          </div>
        </div>
      )}

      {authMessage ? <p className="form-message">{authMessage}</p> : null}
    </section>
  );
}

function formatSyncStatus(status) {
  if (status === "synced") return "已同步";
  if (status === "syncing") return "同步中";
  if (status === "offline") return "离线";
  if (status === "error") return "待重试";
  if (status === "signed-out") return "未登录";
  return "本地";
}
