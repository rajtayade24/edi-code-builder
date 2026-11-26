import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import { checkDbHealth, isDbReady } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import { notFound } from "./middleware/not-found.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

if (env.nodeEnv !== "test") app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication requests. Please try again later." },
});

app.get("/api/health", async (req, res) => {
  try {
    const connected = await checkDbHealth();
    if (!connected) {
      return res.status(503).json({ success: false, service: "surgrisk-api", database: "unavailable" });
    }
    return res.json({ success: true, service: "surgrisk-api", database: "connected" });
  } catch {
    return res.status(503).json({ success: false, service: "surgrisk-api", database: "unavailable" });
  }
});

app.use("/api/auth", authLimiter);
app.use("/api", (req, res, next) => {
  if (!isDbReady()) {
    return res.status(503).json({
      success: false,
      message: "Database service is temporarily unavailable.",
    });
  }
  return next();
});
app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
