import prisma from "../../src/client";
import { beforeAll, beforeEach, afterAll } from "@jest/globals";

const setupTestDB = () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.player.deleteMany();
    await prisma.team.deleteMany();
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.player.deleteMany();
    await prisma.team.deleteMany();
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });
};

export default setupTestDB;
