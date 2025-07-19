import { User } from "@prisma/client";
import { playerService } from "../services";
import catchAsync from "../utils/catchAsync";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

const getPlayers = catchAsync(async (req, res) => {
  const filter = pick(req.body, ["name"]);
  const options = pick(req.body, ["sortBy", "limit", "page"]);
  const result = await playerService.queryPlayers(filter, options);
  res.send(result);
});

const getPlayer = catchAsync(async (req, res) => {
  const result = await playerService.getPlayerById(req.params.id);
  res.send(result);
});

const listPlayer = catchAsync(async (req, res) => {
  const user = req.user as User;
  const askingPrice = req.body.askingPrice;

  if (!user || !user.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const result = await playerService.listPlayer(
    user.teamId,
    req.params.id,
    askingPrice,
    true
  );
  res.send(result);
});

const unListPlayer = catchAsync(async (req, res) => {
  const user = req.user as User;

  if (!user || !user.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }
  const result = await playerService.listPlayer(
    user.teamId,
    req.params.id,
    null,
    false
  );
  res.send(result);
});

const purchasePlayer = catchAsync(async (req, res) => {
  const result = await playerService.purchasePlayer(
    req.params.teamId,
    req.params.playerId
  );
  res.send(result);
});

export default {
  getPlayers,
  getPlayer,
  listPlayer,
  unListPlayer,
  purchasePlayer,
};
