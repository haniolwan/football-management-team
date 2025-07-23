import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import { authService, userService, tokenService } from "../services";
import exclude from "../utils/exclude";
import { TokenType, User } from "@prisma/client";
import ApiError from "../utils/ApiError";

const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await userService.createUser(email, password, name);
  const userWithoutPassword = exclude(user, [
    "password",
    "createdAt",
    "updatedAt",
  ]);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user: userWithoutPassword, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const refreshTokenData = await tokenService.verifyToken(
    req.body.refreshToken,
    TokenType.REFRESH
  );
  const userId = refreshTokenData.userId;
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  const user = await userService.getUserById(userId);
  res.send({
    user,
    tokens,
  });
});

const getUserInfo = catchAsync(async (req, res) => {
  const refreshToken = req.headers.authorization?.replace("Bearer ", "");
  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "No token provided");
  }

  const refreshTokenData = await tokenService.verifyToken(
    refreshToken,
    TokenType.REFRESH
  );
  if (refreshTokenData.userId) {
    const user = await userService.getUserById(refreshTokenData.userId);
    const team = await userService.getUserTeam(refreshTokenData.userId);
    res.send({ user });
  } else {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Session expired");
  }
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  getUserInfo,
};
