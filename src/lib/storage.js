const STORAGE_KEY = "fitness-pwa.workouts";

export function loadWorkouts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeStoredWorkout).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function saveWorkouts(workouts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export function exportWorkouts(workouts) {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "训练日志",
    version: 1,
    workouts,
  };
  return JSON.stringify(payload, null, 2);
}

export function importWorkouts(jsonText) {
  const parsed = JSON.parse(jsonText);
  const workouts = Array.isArray(parsed) ? parsed : parsed.workouts;
  if (!Array.isArray(workouts)) {
    throw new Error("导入文件里没有训练记录数组");
  }
  return workouts.map(normalizeWorkout);
}

function normalizeWorkout(workout) {
  if (!workout || typeof workout !== "object") {
    throw new Error("训练记录格式不正确");
  }

  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
  if (!workout.date || exercises.length === 0) {
    throw new Error("训练记录缺少日期或动作");
  }

  return {
    id: String(workout.id || crypto.randomUUID()),
    date: String(workout.date),
    bodyPart: String(workout.bodyPart || "").trim(),
    createdAt: workout.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: workout.deletedAt || null,
    syncStatus: "pending",
    lastSyncedAt: workout.lastSyncedAt || null,
    exercises: exercises.map((exercise) => ({
      id: String(exercise.id || crypto.randomUUID()),
      name: String(exercise.name || "").trim(),
      weightKg: Number(exercise.weightKg || 0),
      weightMode: exercise.weightMode === "assisted" ? "assisted" : "normal",
      reps: Number.parseInt(exercise.reps || 0, 10),
      sets: Number.parseInt(exercise.sets || 0, 10),
      note: String(exercise.note || "").trim(),
    })),
  };
}

function normalizeStoredWorkout(workout) {
  if (!workout || typeof workout !== "object") {
    return null;
  }

  const now = new Date().toISOString();
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];

  return {
    id: String(workout.id || crypto.randomUUID()),
    date: String(workout.date || ""),
    bodyPart: String(workout.bodyPart || "").trim(),
    createdAt: workout.createdAt || now,
    updatedAt: workout.updatedAt || workout.createdAt || now,
    deletedAt: workout.deletedAt || null,
    syncStatus: workout.syncStatus || "synced",
    lastSyncedAt: workout.lastSyncedAt || null,
    exercises: exercises.map((exercise) => ({
      id: String(exercise.id || crypto.randomUUID()),
      name: String(exercise.name || "").trim(),
      weightKg: Number(exercise.weightKg || 0),
      weightMode: exercise.weightMode === "assisted" ? "assisted" : "normal",
      reps: Number.parseInt(exercise.reps || 0, 10),
      sets: Number.parseInt(exercise.sets || 0, 10),
      note: String(exercise.note || "").trim(),
    })),
  };
}
