import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import prisma from "../../src/client";
import { Prisma } from "@prisma/client";

const password = "password1";
const salt = bcrypt.genSaltSync(8);

export const userOne = {
  name: faker.name.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
};

export const userTwo = {
  name: faker.name.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
};

export const admin = {
  name: faker.name.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
};

export const insertUsers = async (users: Prisma.UserCreateManyInput[]) => {
  await prisma.user.createMany({
    data: users.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password, salt),
    })),
  });
};
