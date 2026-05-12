import { PageHeader } from "../../components/PageHeader.jsx";
import { formatDisplayDate } from "../../lib/date.js";
import { getWorkoutVolume, sortByDateDesc } from "../../lib/useWorkouts.js";

export function HistoryPage({ workoutStore }) {
  const workouts = sortByDateDesc(workoutStore.workouts);
  const groups = workouts.reduce((result, workout) => {
    result[workout.date] = result[workout.date] || [];
    result[workout.date].push(workout);
    return result;
  }, {});

  return (
    <section className="page">
      <PageHeader title="历史" description="按日期查看所有训练记录。" />
      <div className="history-list">
        {workouts.length === 0 ? <p className="empty-text">暂无历史记录。</p> : null}
        {Object.entries(groups).map(([date, dayWorkouts]) => (
          <section className="date-group" key={date}>
            <h2>{formatDisplayDate(date)}</h2>
            {dayWorkouts.map((workout) => (
              <article className="panel" key={workout.id}>
                <div className="panel-head">
                  <p>{workout.exercises.length} 个动作 · 总量 {formatNumber(getWorkoutVolume(workout))} kg</p>
                  <button type="button" onClick={() => workoutStore.deleteWorkout(workout.id)}>删除</button>
                </div>
                {workout.exercises.map((exercise) => (
                  <div className="exercise-row" key={exercise.id}>
                    <strong>{exercise.name}</strong>
                    <span>{exercise.weightKg} kg × {exercise.reps} 次 × {exercise.sets} 组</span>
                    {exercise.note ? <small>{exercise.note}</small> : null}
                  </div>
                ))}
              </article>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value);
}
