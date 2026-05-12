import { PageHeader } from "../../components/PageHeader.jsx";
import { useState } from "react";
import { todayLocalDate } from "../../lib/date.js";

const blankExercise = () => ({
  id: crypto.randomUUID(),
  name: "",
  weightKg: "",
  reps: "",
  sets: "",
  note: "",
});

export function WorkoutEntryPage({ workoutStore }) {
  const [date, setDate] = useState(() => todayLocalDate());
  const [bodyPart, setBodyPart] = useState("");
  const [exercises, setExercises] = useState([blankExercise()]);
  const [message, setMessage] = useState("");

  function updateExercise(id, field, value) {
    setExercises((current) => current.map((exercise) => (exercise.id === id ? { ...exercise, [field]: value } : exercise)));
  }

  function addExercise() {
    setExercises((current) => [...current, blankExercise()]);
  }

  function removeExercise(id) {
    setExercises((current) => (current.length === 1 ? current : current.filter((exercise) => exercise.id !== id)));
  }

  function submitWorkout(event) {
    event.preventDefault();
    const normalized = exercises
      .map((exercise) => ({
        ...exercise,
        name: exercise.name.trim(),
        weightKg: Number(exercise.weightKg),
        reps: Number.parseInt(exercise.reps, 10),
        sets: Number.parseInt(exercise.sets, 10),
        note: exercise.note.trim(),
      }))
      .filter((exercise) => exercise.name && Number.isFinite(exercise.weightKg) && exercise.weightKg !== 0 && exercise.reps > 0 && exercise.sets > 0);

    if (!date || normalized.length === 0) {
      setMessage("请至少填写一个完整动作。");
      return;
    }

    workoutStore.addWorkout({ date, bodyPart: bodyPart.trim(), exercises: normalized });
    setExercises([blankExercise()]);
    setBodyPart("");
    setMessage("已保存这次训练。");
  }

  return (
    <section className="page">
      <PageHeader title="记录" description="新增一次训练，可添加多个动作。" />
      <form className="stack-form" onSubmit={submitWorkout}>
        <label>
          <span>训练日期</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>
        <label>
          <span>今天练的部位</span>
          <input value={bodyPart} onChange={(event) => setBodyPart(event.target.value)} placeholder="胸 / 背 / 肩 / 腿" />
        </label>

        {exercises.map((exercise, index) => (
          <article className="exercise-form" key={exercise.id}>
            <div className="panel-head">
              <h2>动作 {index + 1}</h2>
              <button type="button" onClick={() => removeExercise(exercise.id)}>删除</button>
            </div>
            <label>
              <span>动作名称</span>
              <input value={exercise.name} onChange={(event) => updateExercise(exercise.id, "name", event.target.value)} placeholder="深蹲" />
            </label>
            <div className="form-grid">
              <label>
                <span>重量 kg</span>
                <input inputMode="decimal" step="0.5" type="number" value={exercise.weightKg} onChange={(event) => updateExercise(exercise.id, "weightKg", event.target.value)} />
              </label>
              <label>
                <span>次数</span>
                <input inputMode="numeric" min="1" type="number" value={exercise.reps} onChange={(event) => updateExercise(exercise.id, "reps", event.target.value)} />
              </label>
              <label>
                <span>组数</span>
                <input inputMode="numeric" min="1" type="number" value={exercise.sets} onChange={(event) => updateExercise(exercise.id, "sets", event.target.value)} />
              </label>
            </div>
            <label>
              <span>备注</span>
              <textarea rows="2" value={exercise.note} onChange={(event) => updateExercise(exercise.id, "note", event.target.value)} placeholder="可选，例如状态、器械、感觉" />
            </label>
          </article>
        ))}

        {message ? <p className="form-message">{message}</p> : null}
        <button className="secondary-button" type="button" onClick={addExercise}>添加动作</button>
        <button className="primary-button" type="submit">保存训练</button>
      </form>
    </section>
  );
}
