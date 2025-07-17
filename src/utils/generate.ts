import { faker } from "@faker-js/faker";
import { PositionType } from "@prisma/client";

export const generateRandomPlayers = (teamId: number) => {
  const playersToCreate = [
    {
      count: 3,
      position: PositionType.Goalkeeper,
    },
    {
      count: 6,
      position: PositionType.Defender,
    },
    {
      count: 6,
      position: PositionType.Midfielder,
    },
    {
      count: 5,
      position: PositionType.Attacker,
    },
  ];

  const PLAYER_VALUE_RANGE = { min: 100_000, max: 400_000 };
  const RATING_RANGE = { min: 50, max: 99 };

  const players = [];

  for (const group of playersToCreate) {
    for (let i = 0; i < group.count; i++) {
      players.push({
        name: faker.name.fullName(),
        position: group.position,
        age: faker.datatype.number({ min: 18, max: 35 }),
        nationality: faker.address.country(),
        value: faker.datatype.number(PLAYER_VALUE_RANGE),
        rating: faker.datatype.number(RATING_RANGE),
        teamId,
      });
    }
  }

  return players;
};
