import { Player, Prisma } from "@prisma/client";
import prisma from "../client";

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
    where: filter,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: page * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });

  return players as Promise<Pick<Player, Key>[]>;
};

export default {
  queryPlayers,
};
