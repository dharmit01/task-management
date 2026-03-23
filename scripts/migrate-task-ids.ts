/**
 * One-time migration: assign human-readable Task IDs (TSK-1, TSK-2, …)
 * to all existing tasks that don't yet have one.
 *
 * Run with: npx tsx scripts/migrate-task-ids.ts
 * (or add "migrate-task-ids": "tsx scripts/migrate-task-ids.ts" to package.json scripts)
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env.local") });

import Counter from "../models/Counter.js";
import Task from "../models/Task.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

async function migrateTaskIds() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Connected.");

  // Find all tasks without a taskId, sorted oldest first so IDs are chronological
  const tasks = await Task.find({ taskId: { $exists: false } }).sort({
    createdAt: 1,
  });

  if (tasks.length === 0) {
    console.log("✅ No tasks need migration. All tasks already have a taskId.");
    await mongoose.disconnect();
    return;
  }

  console.log(`📝 Found ${tasks.length} task(s) without a taskId. Migrating…`);

  // Determine the current max seq so we don't conflict with already-migrated tasks
  const existing = await Task.findOne({ taskId: { $exists: true } })
    .sort({ taskId: -1 }) // lexicographic sort is fine for same-length numbers
    .select("taskId");

  let startSeq = 0;
  if (existing?.taskId) {
    const match = existing.taskId.match(/^TSK-(\d+)$/);
    if (match) startSeq = parseInt(match[1], 10);
  }

  // Use bulkWrite for efficiency
  const bulkOps = tasks.map((task, i) => {
    const seq = startSeq + i + 1;
    return {
      updateOne: {
        filter: { _id: task._id, taskId: { $exists: false } },
        update: { $set: { taskId: `TSK-${seq}` } },
      },
    };
  });

  const result = await Task.bulkWrite(bulkOps as any);
  console.log(`✅ Updated ${result.modifiedCount} task(s).`);

  // Set the counter so future task creation continues from the right number
  const finalSeq = startSeq + tasks.length;
  await Counter.findOneAndUpdate(
    { _id: "task" },
    { $max: { seq: finalSeq } }, // only update if our value is higher
    { upsert: true },
  );
  console.log(
    `✅ Counter set to ${finalSeq}. Next task will be TSK-${finalSeq + 1}.`,
  );

  await mongoose.disconnect();
  console.log("🎉 Migration complete.");
}

migrateTaskIds().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
