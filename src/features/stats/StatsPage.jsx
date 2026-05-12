import { PageHeader } from "../../components/PageHeader.jsx";
import { getWorkoutVolume } from "../../lib/useWorkouts.js";

export function StatsPage({ workoutStore }) {
  const { workouts, summary } = workoutStore;
  const totalVolume = workouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);
  const exerciseStats = [...summary.exerciseCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <section className="page">
      <PageHeader title="统计" description="总训练次数、总组数、最常练动作。" />
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
          <span>总训练量</span>
          <strong>{formatNumber(totalVolume)} kg</strong>
        </article>
      </div>

      <section className="panel">
        <h2>常练动作</h2>
        {exerciseStats.length === 0 ? <p className="empty-text">暂无统计。</p> : null}
        {exerciseStats.map(([name, count]) => (
          <div className="stat-row" key={name}>
            <span>{name}</span>
            <strong>{count} 次</strong>
          </div>
        ))}
      </section>
    </section>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value);
}
