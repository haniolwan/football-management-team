import { Player } from "@prisma/client";
import prisma from "../../src/client";
import { userService } from "../../src/services";
import { insertPlayers, playerOne } from "../fixtures/player.fixture";

export const getCreatedPlayer = async (
  userId: number
): Promise<{
  player: Player;
}> => {
  await insertPlayers(userId, [playerOne]);
  const player = (await prisma.player.findFirst({
    where: { id: playerOne.id },
  })) as Player;

  return {
    player,
  };
};

export const createDefaultPlayers = async (
  userId: number,
  teamId: number | null
): Promise<Player[]> => {
  if (teamId) {
    await prisma.team.delete({
      where: { id: teamId },
    });
    await prisma.player.deleteMany({
      where: { teamId },
    });
  }
  const { playersCreated } = await userService.registerUserWithTeamAndPlayers(
    userId
  );
  return playersCreated;
};
