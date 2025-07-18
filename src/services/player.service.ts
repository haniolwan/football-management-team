import { Player, Prisma } from "@prisma/client";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

/**
 * Query for market players
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPlayers = async <Key extends keyof Player>(
  filter: object,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  keys: Key[] = ["id", "name"] as Key[]
): Promise<Pick<Player, Key>[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";

  const players = prisma.player.findMany({
    where: { ...filter, isListed: true },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: page * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });

  return players as Promise<Pick<Player, Key>[]>;
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
 * @param {ObjectId} playerId
 * @returns {Promise<Player>}
 */
const listPlayer = async (playerId: string): Promise<Player> => {
  const player = await getPlayerById(playerId);
  if (!player) {
    throw new ApiError(httpStatus.NOT_FOUND, "Player not found");
  }
  if (player.isListed) {
    return player;
  }
  const updatedPlayer = await prisma.player.update({
    where: { id: player.id },
    data: { isListed: true },
  });
  return updatedPlayer;
};

export default {
  queryPlayers,
  getPlayerById,
  listPlayer,
};
