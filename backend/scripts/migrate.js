import { connectDb, disconnectDb } from "../src/config/db.js";
import * as models from "../src/models/index.js";

try {
  await connectDb();
  for (const [name, Model] of Object.entries(models)) {
    await Model.syncIndexes();
    console.info(`Synced MongoDB indexes for ${name}.`);
  }
  console.info("MongoDB indexes synchronized successfully.");
} catch (error) {
  console.error("MongoDB index synchronization failed:", error.message);
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
