import { Role } from "@prisma/client";

const allRoles = {
  [Role.USER]: [
    "getUserInfo",
    "getPlayers",
    "generatePlayers",
    "registerUserWithTeamAndPlayers",
    "getUserTeam",
    "getPlayer",
    "listPlayer",
    "purchasePlayer",
  ],
  [Role.ADMIN]: [],
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
