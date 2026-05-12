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
                  <p>
                    {workout.bodyPart ? `${workout.bodyPart} · ` : ""}
                    {getExerciseGroups(workout).length} 个动作 · 总量 {formatNumber(getWorkoutVolume(workout))} kg
                  </p>
                  <button type="button" onClick={() => workoutStore.deleteWorkout(workout.id)}>删除</button>
                </div>
                {getExerciseGroups(workout).map((group) => (
                  <section className="exercise-group" key={group.name}>
                    <div className="exercise-group-head">
                      <strong>{group.name}</strong>
                      <span>{group.sets.length} 组</span>
                    </div>
                    <div className="set-list">
                      {group.sets.map((set) => (
                        <div className="set-row" key={set.id}>
                          <span>第 {set.index} 组</span>
                          <strong>{formatNumber(set.weightKg)} kg</strong>
                          <em>{set.reps} 次</em>
                        </div>
                      ))}
                    </div>
                    {group.notes.length ? <small>{group.notes.join("；")}</small> : null}
                  </section>
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

function getExerciseGroups(workout) {
  const groups = new Map();

  workout.exercises.forEach((exercise) => {
    if (!groups.has(exercise.name)) {
      groups.set(exercise.name, { name: exercise.name, notes: [], sets: [] });
    }

    const group = groups.get(exercise.name);
    if (exercise.note && !group.notes.includes(exercise.note)) {
      group.notes.push(exercise.note);
    }

    for (let count = 0; count < exercise.sets; count += 1) {
      group.sets.push({
        id: `${exercise.id}-${count}`,
        index: group.sets.length + 1,
        weightKg: exercise.weightKg,
        reps: exercise.reps,
      });
    }
  });

  return [...groups.values()];
}
