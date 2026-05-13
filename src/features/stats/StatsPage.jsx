import { PageHeader } from "../../components/PageHeader.jsx";

const trackedExercises = ["平板卧推", "高位下拉", "哑铃飞鸟", "哑铃推肩"];

export function StatsPage({ workoutStore }) {
  const { workouts, summary } = workoutStore;
  const exerciseStats = [...summary.exerciseCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxWeights = getTrackedMaxWeights(workouts);

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
        <div className="max-weight-list">
          {trackedExercises.map((name) => (
            <div className="max-weight-row" key={name}>
              <span>{name}</span>
              <strong>{maxWeights.get(name) ? `${formatNumber(maxWeights.get(name))} kg` : "暂无"}</strong>
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

function getTrackedMaxWeights(workouts) {
  const result = new Map(trackedExercises.map((name) => [name, 0]));

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const matchedName = trackedExercises.find((name) => exercise.name.includes(name));
      if (!matchedName) return;
      result.set(matchedName, Math.max(result.get(matchedName), Number(exercise.weightKg) || 0));
    });
  });

  return result;
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value);
}
