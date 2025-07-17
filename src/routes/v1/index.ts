import express from "express";
import authRoute from "./auth.route";
import userRoute from "./user.route";
import playerRoute from "./player.route";
import docsRoute from "./docs.route";
import config from "../../config/config";

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/players",
    route: playerRoute,
  },
];

const devRoutes = [
  {
    path: "/docs",
    route: docsRoute,
  },
];

defaultRoutes.forEach(route => {
  router.use(route.path, route.route);
});

if (config.env === "development") {
  devRoutes.forEach(route => {
    router.use(route.path, route.route);
  });
}

export default router;
