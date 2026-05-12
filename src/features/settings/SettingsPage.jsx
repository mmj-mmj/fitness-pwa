import { PageHeader } from "../../components/PageHeader.jsx";
import { useRef, useState } from "react";
import { exportWorkouts, importWorkouts } from "../../lib/storage.js";

export function SettingsPage({ workoutStore }) {
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
    if (!window.confirm("确定清空所有本地训练数据吗？")) return;
    workoutStore.clearWorkouts();
    setMessage("已清空本地数据。");
  }

  return (
    <section className="page">
      <PageHeader title="我的" description="导出、导入、清空本地数据。" />
      <div className="settings-actions">
        <button className="primary-button" type="button" onClick={downloadJson}>导出 JSON</button>
        <button className="secondary-button" type="button" onClick={() => fileInput.current?.click()}>导入 JSON</button>
        <button className="danger-button" type="button" onClick={clearData}>清空数据</button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleImport} />
      {message ? <p className="form-message">{message}</p> : null}
      <section className="panel">
        <h2>数据说明</h2>
        <p className="empty-text">所有数据只保存在当前浏览器本地。换手机、清理 Safari 数据或卸载 Web App 前，请先导出备份。</p>
      </section>
    </section>
  );
}
