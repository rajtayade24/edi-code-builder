import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

let connectPromise = null;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectPromise) return connectPromise;

  connectPromise = mongoose
    .connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10_000,
    })
    .then((instance) => instance.connection)
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}

export async function checkDbHealth() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return false;
  }
  await mongoose.connection.db.admin().ping();
  return true;
}

mongoose.connection.on("error", (error) => {
  console.error("Unexpected MongoDB connection error:", error.message);
});
