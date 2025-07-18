import { Player, PositionType } from "@prisma/client";
import { playerService } from "../services";
import catchAsync from "../utils/catchAsync";
import pick from "../utils/pick";

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
  const result = await playerService.listPlayer(req.params.id);
  res.send(result);
});

export default {
  getPlayers,
  getPlayer,
  listPlayer,
};
