import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { userService } from "../services";
import { User } from "@prisma/client";

const createUser = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  const user = await userService.createUser(email, password, name);
  res.status(httpStatus.CREATED).send(user);
});

const registerUserWithTeamAndPlayers = catchAsync(async (req, res) => {
  const user = req.user as User;
  if (!user || !user.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }
  const result = await userService.registerUserWithTeamAndPlayers(user.id);
  res.send(result);
});

const getUserTeam = catchAsync(async (req, res) => {
  const user = req.user as User;

  if (!user || !user.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }
  const result = await userService.getUserTeam(user.id);
  res.send(result);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "role"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(user);
});

export default {
  createUser,
  getUsers,
  getUser,
  registerUserWithTeamAndPlayers,
  getUserTeam,
};
