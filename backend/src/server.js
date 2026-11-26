import app from "./app.js";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./config/db.js";

const RETRY_DELAY_MS = 10_000;
let retryTimer = null;

async function connectWithRetry() {
  try {
    await connectDb();
    console.info("Connected to MongoDB.");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error(
      "If using MongoDB Atlas, whitelist your current IP in Atlas -> Network Access, then wait for automatic retry."
    );
    retryTimer = setTimeout(connectWithRetry, RETRY_DELAY_MS);
  }
}

const server = app.listen(env.port, () => {
  console.info(`SurgRisk-AI API listening on http://localhost:${env.port}`);
  console.info(`Health check: http://localhost:${env.port}/api/health`);
  void connectWithRetry();
});

async function shutdown(signal) {
  console.info(`${signal} received. Shutting down gracefully...`);
  if (retryTimer) clearTimeout(retryTimer);
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
