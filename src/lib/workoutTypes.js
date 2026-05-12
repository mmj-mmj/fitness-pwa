export const workoutRecordShape = {
  id: "string",
  date: "YYYY-MM-DD",
  exercises: [
    {
      id: "string",
      name: "string",
      weightKg: "number",
      reps: "number",
      sets: "number",
      note: "string",
    },
  ],
  createdAt: "ISO datetime",
  updatedAt: "ISO datetime",
};
