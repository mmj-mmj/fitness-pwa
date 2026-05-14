import { useEffect, useMemo, useState } from "react";
import { fetchCloudWorkouts, mergeWorkouts, upsertCloudWorkouts } from "./cloudWorkouts.js";
import { todayLocalDate } from "./date.js";
import { loadWorkouts, saveWorkouts } from "./storage.js";

export function useWorkouts(auth) {
  const [storedWorkouts, setStoredWorkouts] = useState(() => loadWorkouts());
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [syncState, setSyncState] = useState({ status: "local", message: "仅本地保存" });
  const userId = auth?.user?.id;
  const canSync = Boolean(auth?.isCloudConfigured && userId && isOnline);

  useEffect(() => {
    function updateOnlineState() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!auth?.isCloudConfigured) {
      setSyncState({ status: "local", message: "仅本地保存" });
      return undefined;
    }

    if (!userId) {
      setSyncState({ status: "signed-out", message: "登录后可云同步" });
      return undefined;
    }

    if (!isOnline) {
      setSyncState({ status: "offline", message: "已离线，数据将稍后同步" });
      return undefined;
    }

    let alive = true;
    setSyncState({ status: "syncing", message: "正在同步云端数据" });

    async function syncOnLogin() {
      try {
        const cloudWorkouts = await fetchCloudWorkouts(userId);
        const merged = mergeWorkouts(loadWorkouts(), cloudWorkouts);
        if (!alive) return;
        const synced = markSynced(merged);
        commitLocal(synced);
        await upsertCloudWorkouts(userId, synced);
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
  }, [auth?.isCloudConfigured, userId, isOnline]);

  function addWorkout(workout) {
    const now = new Date().toISOString();
    const nextWorkouts = [
      {
        ...workout,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncStatus: "pending",
        lastSyncedAt: null,
      },
      ...storedWorkouts,
    ];
    commit(nextWorkouts);
  }

  function deleteWorkout(id) {
    const now = new Date().toISOString();
    const nextWorkouts = storedWorkouts.map((workout) =>
      workout.id === id
        ? { ...workout, deletedAt: now, updatedAt: now, syncStatus: "pending" }
        : workout,
    );
    commit(nextWorkouts);
  }

  function replaceWorkouts(nextWorkouts) {
    const now = new Date().toISOString();
    commit(nextWorkouts.map((workout) => ({ ...workout, updatedAt: workout.updatedAt || now, syncStatus: "pending" })));
  }

  function clearWorkouts() {
    const now = new Date().toISOString();
    commit(
      storedWorkouts.map((workout) => ({
        ...workout,
        deletedAt: workout.deletedAt || now,
        updatedAt: now,
        syncStatus: "pending",
      })),
    );
  }

  function commitLocal(nextWorkouts) {
    setStoredWorkouts(nextWorkouts);
    saveWorkouts(nextWorkouts);
  }

  function commit(nextWorkouts) {
    commitLocal(nextWorkouts);
    runCloudTask(nextWorkouts);
  }

  async function runCloudTask(nextWorkouts = storedWorkouts) {
    if (!auth?.isCloudConfigured || !userId) return;
    if (!isOnline) {
      setSyncState({ status: "offline", message: "已离线，数据将稍后同步" });
      return;
    }

    setSyncState({ status: "syncing", message: "正在同步" });
    try {
      await upsertCloudWorkouts(userId, nextWorkouts.filter((workout) => workout.syncStatus !== "synced"));
      commitLocal(markSynced(nextWorkouts));
      setSyncState({ status: "synced", message: "云同步已开启" });
    } catch (error) {
      setSyncState({ status: "error", message: error.message || "同步失败，点击重试" });
    }
  }

  async function syncNow() {
    if (!auth?.isCloudConfigured || !userId) return;
    if (!isOnline) {
      setSyncState({ status: "offline", message: "已离线，数据将稍后同步" });
      return;
    }

    setSyncState({ status: "syncing", message: "正在同步" });
    try {
      const cloudWorkouts = await fetchCloudWorkouts(userId);
      const merged = mergeWorkouts(loadWorkouts(), cloudWorkouts);
      await upsertCloudWorkouts(userId, merged);
      commitLocal(markSynced(merged));
      setSyncState({ status: "synced", message: "云同步已开启" });
    } catch (error) {
      setSyncState({ status: "error", message: error.message || "同步失败，点击重试" });
    }
  }

  const workouts = useMemo(() => storedWorkouts.filter((workout) => !workout.deletedAt), [storedWorkouts]);

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
    isOnline,
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
  return workout.exercises.reduce((sum, exercise) => {
    if (exercise.weightMode === "assisted") return sum;
    return sum + exercise.weightKg * exercise.reps * exercise.sets;
  }, 0);
}

function markSynced(workouts) {
  const now = new Date().toISOString();
  return workouts.map((workout) => ({ ...workout, syncStatus: "synced", lastSyncedAt: now }));
}
