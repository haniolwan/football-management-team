import { User, Prisma, Team } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import { encryptPassword } from "../utils/encryption";
import { generateRandomPlayers } from "../utils/generate";
import { RegisterTeamResponse } from "../types/response";

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  if (await getUserByEmail(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  return prisma.user.create({
    data: {
      email,
      name,
      password: await encryptPassword(password),
    },
  });
};

/**
 * Query for users
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async <Key extends keyof User>(
  filter: object,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  keys: Key[] = [
    "id",
    "email",
    "name",
    "password",
    "role",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<User, Key>[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";
  const users = await prisma.user.findMany({
    where: filter,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });
  return users as Pick<User, Key>[];
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserById = async <Key extends keyof User>(
  id: number,
  keys: Key[] = ["id", "email", "name", "teamId", "role"] as Key[]
): Promise<Pick<User, Key> | null> => {
  return prisma.user.findUnique({
    where: { id },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  }) as Promise<Pick<User, Key> | null>;
};

/**
 * Get user by email
 * @param {string} email
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserByEmail = async <Key extends keyof User>(
  email: string,
  keys: Key[] = [
    "id",
    "email",
    "name",
    "password",
    "role",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<User, Key> | null> => {
  return prisma.user.findUnique({
    where: { email },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  }) as Promise<Pick<User, Key> | null>;
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async <Key extends keyof User>(
  userId: number,
  updateBody: Prisma.UserUpdateInput,
  keys: Key[] = ["id", "email", "name", "role"] as Key[]
): Promise<Pick<User, Key> | null> => {
  const user = await getUserById(userId, ["id", "email", "name"]);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  });
  return updatedUser as Pick<User, Key> | null;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId: number): Promise<User> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await prisma.user.delete({ where: { id: user.id } });
  return user;
};

/**
 * Create user team and add players
 * @param {ObjectId} userId
 * @returns {Promise<RegisterTeamResponse>}
 */

const registerUserWithTeamAndPlayers = async (
  userId: number
): Promise<RegisterTeamResponse> => {
  return await prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const team = await tx.team.create({
      data: {
        name: `${user.name}'s Team`,
        userId: user.id,
      },
    });

    const players = generateRandomPlayers(team.id);

    await tx.player.createMany({
      data: players,
    });

    await tx.user.update({
      where: { id: user.id },
      data: { teamId: team.id },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        teamId: team.id,
      },
      team,
      playersCreated: players,
    };
  });
};

/**
 * Get user team and players
 * @param {ObjectId} userId
 * @returns {Promise<Team>}
 */

const getUserTeam = async (userId: number): Promise<Team> => {
  return await prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const team = await tx.team.findFirst({
      where: {
        userId,
      },
      include: {
        Player: true,
      },
    });

    if (!team) {
      throw new ApiError(httpStatus.NOT_FOUND, "Team not found");
    }

    const result = {
      ...team,
      players: team.Player,
    };

    return result;
  });
};

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  registerUserWithTeamAndPlayers,
  getUserTeam,
};
