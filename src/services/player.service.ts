import { Player } from "@prisma/client";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import ApiSuccess from "../utils/ApiSuccess";

/**
 * Query for market players
 * @param {{ name?: string, team_name?: string }} filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPlayers = async <Key extends keyof Player>(
  filter: {
    name?: string;
    price?: number;
    team_name?: string;
    isListed?: boolean;
  },
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  keys: Key[] = [
    "id",
    "name",
    "isListed",
    "age",
    "value",
    "position",
    "nationality",
    "askingPrice",
    "rating",
    "teamId",
    "team",
  ] as Key[]
): Promise<Pick<Player, Key>[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortType = options.sortType ?? "desc";
  const select = keys.reduce((obj, k) => ({ ...obj, [k]: true }), {});
  let sortBy = options.sortBy ?? "";

  const allowedSortFields = ["askingPrice"];
  if (!allowedSortFields.includes(sortBy)) sortBy = "askingPrice";

  const players = await prisma.player.findMany({
    where: {
      ...(filter.isListed !== undefined && { isListed: filter.isListed }),
      askingPrice: { not: null },
      ...(filter.name && {
        name: {
          contains: filter.name,
          mode: "insensitive",
        },
      }),
      ...(filter.team_name && {
        team: {
          name: {
            contains: filter.team_name,
            mode: "insensitive",
          },
        },
      }),
    },
    select,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });

  return players as Pick<Player, Key>[];
};

/**
 * Get player by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Player, Key> | null>}
 */
const getPlayerById = async <Key extends keyof Player>(
  id: string,
  keys: Key[] = [
    "id",
    "name",
    "isListed",
    "age",
    "value",
    "position",
    "nationality",
    "askingPrice",
    "rating",
    "teamId",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<Player, Key> | null> => {
  return prisma.player.findUnique({
    where: { id },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  }) as Promise<Pick<Player, Key> | null>;
};

/**
 * List player by id
 * @param {ObjectId} teamId
 * @param {ObjectId} playerId
 * @param {Int} askingPrice
 * @param {boolean} listed
 * @returns {Promise<Player>}
 */
const listPlayer = async (
  teamId: number | null,
  playerId: string,
  askingPrice: number | null,
  listed: boolean
): Promise<Player> => {
  const allPlayers = await prisma.player.findMany({
    where: { teamId },
  });
  const unListedPlayersCount = allPlayers.filter(
    player => !player.isListed
  ).length;

  if (listed && unListedPlayersCount <= 15) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Team must have at-least 15 active players"
    );
  }

  const player = await getPlayerById(playerId);
  if (!player) {
    throw new ApiError(httpStatus.NOT_FOUND, "Player not found");
  }
  if (player.isListed === listed) {
    return player;
  }
  const updatedPlayer = await prisma.player.update({
    where: { id: player.id },
    data: { isListed: listed, askingPrice: askingPrice },
  });

  return updatedPlayer;
};

/**
 * Purchase player by id
 * @param {ObjectId} teamId
 * @param {ObjectId} playerId
 * @returns {void}
 */
const purchasePlayer = async (teamId: number, playerId: string) => {
  const allPlayers = await prisma.player.count({
    where: { teamId },
  });

  if (allPlayers >= 25) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Player limit exceeded: You can't have more than 25 players."
    );
  }
  const player = await getPlayerById(playerId);

  if (!player) {
    throw new ApiError(httpStatus.NOT_FOUND, "Player not found");
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if (!team) {
    throw new ApiError(httpStatus.NOT_FOUND, "Team not found");
  }

  if (player.askingPrice === null || team.budget === null) {
    throw new ApiError(httpStatus.FORBIDDEN, "Missing price or budget info");
  }

  if (player.askingPrice > team.budget) {
    throw new ApiError(httpStatus.FORBIDDEN, "Player price is over budget");
  }

  return await prisma.$transaction(async tx => {
    const finalPlayerCheck = await tx.player.findUnique({
      where: { id: player.id },
      select: { isListed: true, teamId: true },
    });

    if (!finalPlayerCheck?.isListed) {
      throw new ApiError(httpStatus.FORBIDDEN, "Player is no longer listed");
    }

    await tx.player.update({
      where: { id: player.id },
      data: { teamId: team.id, isListed: false },
    });

    const finalPrice = Math.floor(player.askingPrice! * 0.95);

    await tx.team.update({
      where: { id: team.id },
      data: { budget: { decrement: finalPrice } },
    });

    await tx.team.update({
      where: { id: finalPlayerCheck.teamId! },
      data: { budget: { increment: finalPrice } },
    });

    const playerUpdated = await tx.player.findFirst({
      where: { id: playerId },
    });

    return new ApiSuccess(httpStatus.OK, "Player Bought Successfully", {
      player: playerUpdated,
    });
  });
};

export default {
  queryPlayers,
  getPlayerById,
  listPlayer,
  purchasePlayer,
};
