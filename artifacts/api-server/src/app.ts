import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ---------------------------------------------------------------------------
// Security: Helmet & powered-by header
// ---------------------------------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
app.disable("x-powered-by");

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ---------------------------------------------------------------------------
// Security: CORS — allow only the configured origins (HIGH-05 fix bundled here)
// ALLOWED_ORIGINS env var is a comma-separated list of allowed origins.
// Falls back to localhost:3000 for local development only.
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed.`));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "apikey"],
  }),
);


// ---------------------------------------------------------------------------
// Security: Rate Limiting (HIGH-01 fix)
//
// Tier 1 — General API: 120 requests per minute per IP (covers all /api routes)
// Tier 2 — Strict:      10 requests per 15 minutes per IP (for auth-adjacent routes)
// ---------------------------------------------------------------------------

/** General limiter — applied to all /api routes */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute window
  max: 120,                   // max 120 requests per IP per window
  standardHeaders: "draft-7", // include RateLimit-* headers in responses
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again." },
  handler: (req: Request, res: Response, _next: NextFunction, options: any) => {
    logger.warn({ ip: req.ip, url: req.url }, "Rate limit exceeded");
    res.status(options.statusCode).json(options.message);
  },
});

/** Strict limiter — for any auth-adjacent or sensitive mutation routes */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minute window
  max: 10,                    // max 10 requests per IP per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests on this endpoint. Please wait 15 minutes." },
  handler: (req: Request, res: Response, _next: NextFunction, options: any) => {
    logger.warn({ ip: req.ip, url: req.url }, "Strict rate limit exceeded");
    res.status(options.statusCode).json(options.message);
  },
});

app.use(express.json({ limit: "1mb" })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Apply general rate limit to all API routes
app.use("/api", generalLimiter);
app.use("/api", router);

export default app;

