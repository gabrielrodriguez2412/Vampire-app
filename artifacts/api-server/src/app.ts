import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const corsOrigin = process.env["CORS_ORIGIN"];
const corsOrigins = corsOrigin
  ?.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const corsOptions = corsOrigins?.length
  ? {
      origin: corsOrigins,
      credentials: true,
    }
  : undefined;

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
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check for Railway deployment checks
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

export default app;