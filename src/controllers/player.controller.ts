import { Player, PositionType } from "@prisma/client";
import { playerService, userService } from "../services";
import catchAsync from "../utils/catchAsync";
import pick from "../utils/pick";
import { faker } from "@faker-js/faker";

const getPlayers = catchAsync(async (req, res) => {
  const filter = pick(req.body, ["name"]);
  const options = pick(req.body, ["sortBy", "limit", "page"]);
  const result = await playerService.queryPlayers(filter, options);
  res.send(result);
});

export default {
  getPlayers,
};
