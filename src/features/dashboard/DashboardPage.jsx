import { PageHeader } from "../../components/PageHeader.jsx";
import { formatDisplayDate } from "../../lib/date.js";

export function DashboardPage({ workoutStore, goToTab }) {
  const { summary, workouts } = workoutStore;
  const recentWorkoutDays = getRecentWorkoutDays(workouts);

  return (
    <section className="page">
      <PageHeader title="首页" description="今日训练状态、最近健身日期和快捷入口。" />

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
          <h2>近一个月训练日期</h2>
          <button type="button" onClick={() => goToTab("history")}>查看历史</button>
        </div>
        {recentWorkoutDays.length > 0 ? (
          <div className="recent-days-list">
            {recentWorkoutDays.map((day) => (
              <div className="recent-day-row" key={day.date}>
                <strong>{formatDisplayDate(day.date)}</strong>
                <span>{day.focus}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">近一个月还没有训练记录。</p>
        )}
      </section>
    </section>
  );
}

function getRecentWorkoutDays(workouts) {
  const today = startOfLocalDay(new Date());
  const monthAgo = new Date(today);
  monthAgo.setDate(today.getDate() - 29);

  const grouped = new Map();
  workouts.forEach((workout) => {
    const workoutDate = startOfLocalDay(new Date(`${workout.date}T00:00:00`));
    if (workoutDate < monthAgo || workoutDate > today) return;

    if (!grouped.has(workout.date)) {
      grouped.set(workout.date, { date: workout.date, focusSet: new Set(), exerciseSet: new Set() });
    }

    const group = grouped.get(workout.date);
    const bodyPart = workout.bodyPart?.trim();
    if (bodyPart) {
      group.focusSet.add(bodyPart);
    }
    workout.exercises.forEach((exercise) => {
      if (exercise.name?.trim()) {
        group.exerciseSet.add(exercise.name.trim());
      }
    });
  });

  return [...grouped.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((group) => ({
      date: group.date,
      focus: summarizeFocus(group.focusSet, group.exerciseSet),
    }));
}

function summarizeFocus(focusSet, exerciseSet) {
  const focus = [...focusSet].slice(0, 3);
  if (focus.length > 0) {
    return focus.join(" / ");
  }

  const exercises = [...exerciseSet].slice(0, 3);
  if (exercises.length > 0) {
    return `动作：${exercises.join(" / ")}`;
  }

  return "未填写部位";
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
