import { Role } from "@prisma/client";

const allRoles = {
  [Role.USER]: [
    "getPlayers",
    "generatePlayers",
    "registerUserWithTeamAndPlayers",
    "getUserTeam",
    "getPlayer",
    "listPlayer",
  ],
  [Role.ADMIN]: [],
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
