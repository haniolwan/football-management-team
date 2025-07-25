import express from "express";
import helmet from "helmet";
import compression from "@polka/compression";
import cors from "cors";
import passport from "passport";
import httpStatus from "http-status";
import config from "./config/config";
import morgan from "./config/morgan";
import xss from "./middlewares/xss";
import { jwtStrategy } from "./config/passport";
import { authLimiter } from "./middlewares/rateLimiter";
import routes from "./routes/v1";
import { errorConverter, errorHandler } from "./middlewares/error";
import ApiError from "./utils/ApiError";

const app = express();

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

app.use(helmet());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(xss());

app.use(compression());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.options("*", cors());

passport.use("jwt", jwtStrategy);

if (config.env === "production") {
  app.use("/v1/auth", authLimiter);
}

app.use("/v1", routes);

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

app.use(errorConverter);

app.use(errorHandler);

export default app;
