import { TokenType, User } from "@prisma/client";
import prisma from "../../src/client";
import { insertUsers, userOne } from "../fixtures/user.fixture";
import moment from "moment";
import config from "../../src/config/config";
import { tokenService } from "../../src/services";

export const getAuthenticatedUser = async (): Promise<{
  user: User;
  token: string;
}> => {
  await insertUsers([userOne]);
  const user = (await prisma.user.findFirst({
    where: { email: userOne.email },
  })) as User;

  const expires = moment().add(config.jwt.accessExpirationMinutes, "minutes");

  const token = tokenService.generateToken(user.id, expires, TokenType.ACCESS);

  return {
    user,
    token,
  };
};
