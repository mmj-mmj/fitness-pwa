import { PageHeader } from "../../components/PageHeader.jsx";

export function StatsPage({ workoutStore }) {
  const { workouts, summary } = workoutStore;
  const exerciseStats = [...summary.exerciseCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxWeights = getAllMaxWeights(workouts);

  return (
    <section className="page">
      <PageHeader title="统计" description="训练次数、重点动作最大重量和常练动作。" />
      <div className="stats-summary">
        <article>
          <span>训练次数</span>
          <strong>{summary.totalWorkouts}</strong>
        </article>
      </div>

      <section className="panel stats-panel">
        <h2>最大重量</h2>
        {maxWeights.length === 0 ? <p className="empty-text">暂无统计。</p> : null}
        <div className="max-weight-list">
          {maxWeights.map(([name, weight]) => (
            <div className="max-weight-row" key={name}>
              <span>{name}</span>
              <strong>{`${formatNumber(weight)} kg`}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stats-panel">
        <h2>常练动作</h2>
        {exerciseStats.length === 0 ? <p className="empty-text">暂无统计。</p> : null}
        {exerciseStats.slice(0, 8).map(([name, count]) => (
          <div className="stat-row" key={name}>
            <span>{name}</span>
            <strong>{count} 次</strong>
          </div>
        ))}
      </section>
    </section>
  );
}

function getAllMaxWeights(workouts) {
  const result = new Map();

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const name = exercise.name?.trim();
      const weight = Number(exercise.weightKg) || 0;
      if (!name || weight <= 0 || exercise.weightMode === "assisted") return;
      result.set(name, Math.max(result.get(name) || 0, weight));
    });
  });

  return [...result.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value);
}
