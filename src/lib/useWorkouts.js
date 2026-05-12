import { useMemo, useState } from "react";
import { todayLocalDate } from "./date.js";
import { loadWorkouts, saveWorkouts } from "./storage.js";

export function useWorkouts() {
  const [workouts, setWorkouts] = useState(() => loadWorkouts());

  function addWorkout(workout) {
    commit([
      {
        ...workout,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...workouts,
    ]);
  }

  function deleteWorkout(id) {
    commit(workouts.filter((workout) => workout.id !== id));
  }

  function replaceWorkouts(nextWorkouts) {
    commit(nextWorkouts);
  }

  function clearWorkouts() {
    commit([]);
  }

  function commit(nextWorkouts) {
    setWorkouts(nextWorkouts);
    saveWorkouts(nextWorkouts);
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
    addWorkout,
    deleteWorkout,
    replaceWorkouts,
    clearWorkouts,
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
