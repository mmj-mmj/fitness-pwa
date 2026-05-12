import { PageHeader } from "../../components/PageHeader.jsx";
import { formatDisplayDate } from "../../lib/date.js";
import { getWorkoutVolume } from "../../lib/useWorkouts.js";

export function DashboardPage({ workoutStore, goToTab }) {
  const { summary } = workoutStore;
  const latest = summary.latestWorkout;

  return (
    <section className="page">
      <PageHeader title="首页" description="今日训练状态、最近一次训练和快捷入口。" />

      <div className="status-card">
        <span>{summary.trainedToday ? "今天已训练" : "今天还未训练"}</span>
        <strong>{summary.trainedToday ? "保持节奏很好" : "记录今天第一组"}</strong>
        <button type="button" onClick={() => goToTab("record")}>去记录</button>
      </div>

      <div className="metric-grid">
        <article>
          <span>训练次数</span>
          <strong>{summary.totalWorkouts}</strong>
        </article>
        <article>
          <span>总组数</span>
          <strong>{summary.totalSets}</strong>
        </article>
        <article>
          <span>常练动作</span>
          <strong>{summary.favoriteExercise}</strong>
        </article>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>最近一次</h2>
          <button type="button" onClick={() => goToTab("history")}>查看历史</button>
        </div>
        {latest ? (
          <div className="latest-list">
            <p>{formatDisplayDate(latest.date)} · 总量 {formatNumber(getWorkoutVolume(latest))} kg</p>
            {latest.exercises.map((exercise) => (
              <div className="exercise-row" key={exercise.id}>
                <strong>{exercise.name}</strong>
                <span>{exercise.weightKg} kg × {exercise.reps} 次 × {exercise.sets} 组</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">还没有训练记录。</p>
        )}
      </section>
    </section>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value);
}
