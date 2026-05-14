import { supabase } from "./supabaseClient.js";

function toCloudRow(userId, workout) {
  return {
    id: workout.id,
    user_id: userId,
    date: workout.date,
    body_part: workout.bodyPart || "",
    exercises: workout.exercises || [],
    deleted_at: workout.deletedAt || null,
    created_at: workout.createdAt || new Date().toISOString(),
    updated_at: workout.updatedAt || new Date().toISOString(),
  };
}

function fromCloudRow(row) {
  return {
    id: row.id,
    date: row.date,
    bodyPart: row.body_part || "",
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
    deletedAt: row.deleted_at || null,
    syncStatus: "synced",
    lastSyncedAt: row.last_synced_at || row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchCloudWorkouts(userId) {
  const { data, error } = await supabase
    .from("workouts")
    .select("id,date,body_part,exercises,deleted_at,created_at,updated_at")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data.map(fromCloudRow);
}

export async function upsertCloudWorkouts(userId, workouts) {
  if (workouts.length === 0) return;
  const { error } = await supabase
    .from("workouts")
    .upsert(workouts.map((workout) => toCloudRow(userId, workout)), { onConflict: "id" });

  if (error) throw error;
}

export function mergeWorkouts(localWorkouts, cloudWorkouts) {
  const merged = new Map();

  [...localWorkouts, ...cloudWorkouts].forEach((workout) => {
    const existing = merged.get(workout.id);
    if (!existing || new Date(workout.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
      merged.set(workout.id, workout);
    }
  });

  return [...merged.values()];
}
