import { faker } from "@faker-js/faker";
import prisma from "../../src/client";
import { $Enums, Prisma } from "@prisma/client";

export const teamOne = {
  id: faker.datatype.number({ min: 1, max: 10000 }),
  name: "Fake_team",
  budget: 5000000,
};

export const playerOne = {
  id: faker.datatype.uuid(),
  name: faker.name.fullName(),
  isListed: faker.datatype.boolean(),
  position: $Enums.PositionType.Attacker,
  age: 25,
  nationality: "",
  value: 20000,
  rating: 80,
  teamId: teamOne.id,
};

export const insertPlayers = async (
  userId: number,
  players: Prisma.PlayerCreateManyInput[]
) => {
  await prisma.team.create({
    data: { ...teamOne, userId },
  });
  await prisma.player.createMany({
    data: players.map(player => ({
      ...player,
    })),
  });
};
