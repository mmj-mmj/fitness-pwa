import { PageHeader } from "../../components/PageHeader.jsx";
import { useState } from "react";
import { todayLocalDate } from "../../lib/date.js";

const blankSet = () => ({
  id: crypto.randomUUID(),
  weightKg: "",
  reps: "",
  sets: "",
});

const blankExercise = () => ({
  id: crypto.randomUUID(),
  name: "",
  note: "",
  setRows: [blankSet()],
});

export function WorkoutEntryPage({ workoutStore }) {
  const [date, setDate] = useState(() => todayLocalDate());
  const [bodyPart, setBodyPart] = useState("");
  const [exercises, setExercises] = useState([blankExercise()]);
  const [message, setMessage] = useState("");

  function updateExercise(id, field, value) {
    setExercises((current) => current.map((exercise) => (exercise.id === id ? { ...exercise, [field]: value } : exercise)));
  }

  function updateSetRow(exerciseId, setId, field, value) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              setRows: exercise.setRows.map((setRow) => (setRow.id === setId ? { ...setRow, [field]: value } : setRow)),
            }
          : exercise,
      ),
    );
  }

  function addSetRow(exerciseId) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, setRows: [...exercise.setRows, blankSet()] } : exercise,
      ),
    );
  }

  function removeSetRow(exerciseId, setId) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              setRows: exercise.setRows.length === 1 ? exercise.setRows : exercise.setRows.filter((setRow) => setRow.id !== setId),
            }
          : exercise,
      ),
    );
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
      .flatMap((exercise) =>
        exercise.setRows.map((setRow) => ({
          id: crypto.randomUUID(),
          name: exercise.name.trim(),
          weightKg: Number(setRow.weightKg),
          reps: Number.parseInt(setRow.reps, 10),
          sets: Number.parseInt(setRow.sets, 10),
          note: exercise.note.trim(),
        })),
      )
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
            <div className="set-form">
              <div className="set-form-head">
                <span>重量记录</span>
                <button type="button" onClick={() => addSetRow(exercise.id)}>添加一条</button>
              </div>
              <div className="set-form-list">
                {exercise.setRows.map((setRow, setIndex) => (
                  <section className="set-form-row" key={setRow.id}>
                    <div className="set-form-row-head">
                      <strong>记录 {setIndex + 1}</strong>
                      <button type="button" onClick={() => removeSetRow(exercise.id, setRow.id)}>移除</button>
                    </div>
                    <div className="form-grid">
                      <label>
                        <span>重量 kg</span>
                        <input inputMode="decimal" step="0.5" type="number" value={setRow.weightKg} onChange={(event) => updateSetRow(exercise.id, setRow.id, "weightKg", event.target.value)} />
                      </label>
                      <label>
                        <span>次数</span>
                        <input inputMode="numeric" min="1" type="number" value={setRow.reps} onChange={(event) => updateSetRow(exercise.id, setRow.id, "reps", event.target.value)} />
                      </label>
                      <label>
                        <span>组数</span>
                        <input inputMode="numeric" min="1" type="number" value={setRow.sets} onChange={(event) => updateSetRow(exercise.id, setRow.id, "sets", event.target.value)} />
                      </label>
                    </div>
                  </section>
                ))}
              </div>
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
