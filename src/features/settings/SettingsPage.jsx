import { PageHeader } from "../../components/PageHeader.jsx";
import { useRef, useState } from "react";
import { exportWorkouts, importWorkouts } from "../../lib/storage.js";

export function SettingsPage({ auth, workoutStore }) {
  const fileInput = useRef(null);
  const [message, setMessage] = useState("");

  function downloadJson() {
    const blob = new Blob([exportWorkouts(workoutStore.workouts)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `训练日志-${new Date().toISOString().slice(0, 10)}.json`;
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
        <button className="danger-button" type="button" onClick={clearData}>清空数据</button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleImport} />
      {message ? <p className="form-message">{message}</p> : null}
      <section className="panel">
        <h2>数据说明</h2>
        <p className="empty-text">未登录时数据只保存在当前设备本地。登录后会自动合并本地和云端记录；换手机登录同一账号即可同步。</p>
      </section>
    </section>
  );
}

function AuthPanel({ auth, syncState, onSyncNow }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  async function handleAuth(action) {
    setBusy(true);
    setAuthMessage("");

    try {
      if (action === "sign-up") {
        await auth.signUp(email.trim(), password);
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
        <span className={`sync-badge ${syncState.status}`}>{syncState.status === "synced" ? "已同步" : "本地"}</span>
      </div>

      {!auth.isCloudConfigured ? (
        <div className="auth-form">
          <p className="empty-text">云同步入口已预留。配置 Supabase 后，下面的登录和注册就会启用。</p>
          <label>
            <span>邮箱</span>
            <input disabled placeholder="you@example.com" />
          </label>
          <label>
            <span>密码</span>
            <input disabled placeholder="至少 6 位" type="password" />
          </label>
          <div className="auth-actions">
            <button className="primary-button" type="button" disabled>登录</button>
            <button className="secondary-button" type="button" disabled>注册</button>
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
          <div className="auth-actions">
            <button className="primary-button" type="button" onClick={() => handleAuth("sign-in")} disabled={busy || !email || !password}>登录</button>
            <button className="secondary-button" type="button" onClick={() => handleAuth("sign-up")} disabled={busy || !email || !password}>注册</button>
          </div>
        </div>
      )}

      {authMessage ? <p className="form-message">{authMessage}</p> : null}
    </section>
  );
}
