import { useEffect, useMemo, useState } from "react";
import { clearCloudWorkouts, deleteCloudWorkout, fetchCloudWorkouts, mergeWorkouts, upsertCloudWorkouts } from "./cloudWorkouts.js";
import { todayLocalDate } from "./date.js";
import { loadWorkouts, saveWorkouts } from "./storage.js";

export function useWorkouts(auth) {
  const [workouts, setWorkouts] = useState(() => loadWorkouts());
  const [syncState, setSyncState] = useState({ status: "local", message: "仅本地保存" });
  const userId = auth?.user?.id;
  const canSync = Boolean(auth?.isCloudConfigured && userId);

  useEffect(() => {
    if (!auth?.isCloudConfigured) {
      setSyncState({ status: "local", message: "仅本地保存" });
      return undefined;
    }

    if (!userId) {
      setSyncState({ status: "signed-out", message: "登录后可云同步" });
      return undefined;
    }

    let alive = true;
    setSyncState({ status: "syncing", message: "正在同步云端数据" });

    async function syncOnLogin() {
      try {
        const cloudWorkouts = await fetchCloudWorkouts(userId);
        const merged = mergeWorkouts(loadWorkouts(), cloudWorkouts);
        if (!alive) return;
        commitLocal(merged);
        await upsertCloudWorkouts(userId, merged);
        if (!alive) return;
        setSyncState({ status: "synced", message: "云同步已开启" });
      } catch (error) {
        if (!alive) return;
        setSyncState({ status: "error", message: error.message || "云同步失败" });
      }
    }

    syncOnLogin();

    return () => {
      alive = false;
    };
  }, [auth?.isCloudConfigured, userId]);

  function addWorkout(workout) {
    const now = new Date().toISOString();
    const nextWorkouts = [
      {
        ...workout,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      },
      ...workouts,
    ];
    commit(nextWorkouts, "upsert");
  }

  function deleteWorkout(id) {
    const nextWorkouts = workouts.filter((workout) => workout.id !== id);
    commitLocal(nextWorkouts);
    runCloudTask(() => deleteCloudWorkout(userId, id));
  }

  function replaceWorkouts(nextWorkouts) {
    commit(nextWorkouts, "upsert");
  }

  function clearWorkouts() {
    commitLocal([]);
    runCloudTask(() => clearCloudWorkouts(userId));
  }

  function commitLocal(nextWorkouts) {
    setWorkouts(nextWorkouts);
    saveWorkouts(nextWorkouts);
  }

  function commit(nextWorkouts, cloudAction) {
    commitLocal(nextWorkouts);
    if (cloudAction === "upsert") {
      runCloudTask(() => upsertCloudWorkouts(userId, nextWorkouts));
    }
  }

  async function runCloudTask(task) {
    if (!canSync) return;

    setSyncState({ status: "syncing", message: "正在同步" });
    try {
      await task();
      setSyncState({ status: "synced", message: "云同步已开启" });
    } catch (error) {
      setSyncState({ status: "error", message: error.message || "云同步失败" });
    }
  }

  async function syncNow() {
    if (!canSync) return;
    await runCloudTask(async () => {
      const cloudWorkouts = await fetchCloudWorkouts(userId);
      const merged = mergeWorkouts(loadWorkouts(), cloudWorkouts);
      commitLocal(merged);
      await upsertCloudWorkouts(userId, merged);
    });
  }

  const summary = useMemo(() => {
    const sorted = sortByDateDesc(workouts);
    const today = todayLocalDate();
    const totalSets = workouts.reduce((sum, workout) => {
      return sum + workout.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets, 0);
    }, 0);
    const exerciseCounts = new Map();

    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        exerciseCounts.set(exercise.name, (exerciseCounts.get(exercise.name) || 0) + 1);
      });
    });

    const favoriteExercise =
      [...exerciseCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "暂无";

    return {
      trainedToday: workouts.some((workout) => workout.date === today),
      latestWorkout: sorted[0] || null,
      totalWorkouts: workouts.length,
      totalSets,
      favoriteExercise,
      exerciseCounts,
    };
  }, [workouts]);

  return {
    workouts,
    summary,
    syncState,
    addWorkout,
    deleteWorkout,
    replaceWorkouts,
    clearWorkouts,
    syncNow,
  };
}

export function sortByDateDesc(workouts) {
  return [...workouts].sort((a, b) => {
    if (a.date === b.date) return new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`);
  });
}

export function getWorkoutVolume(workout) {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.weightKg * exercise.reps * exercise.sets, 0);
}
