import { beforeAll, describe, expect, test } from "@jest/globals";
import httpStatus from "http-status";
import request from "supertest";
import app from "../../src/app";
import { User } from "@prisma/client";
import {
  GetTeamResponse,
  RegisterTeamResponse,
} from "../../src/types/response";
import { getAuthenticatedUser } from "../utils/authHelper";
import { playerShape, teamShape } from "../fixtures/user.matchers";

describe("Team routes", () => {
  let accessToken: string;
  let dbUser: User;

  beforeAll(async () => {
    const { token, user } = await getAuthenticatedUser();
    accessToken = token;
    dbUser = user;
  });

  describe("POST /v1/users/team", () => {
    test("should register team and players and return user, team, and players data", async () => {
      const res = await request(app)
        .post("/v1/users/team")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      expect(res.status).toBe(httpStatus.OK);

      const response = res.body as RegisterTeamResponse;

      expect(response.user).toEqual(
        expect.objectContaining({
          id: expect.anything(),
          name: dbUser.name,
          email: dbUser.email,
        })
      );

      expect(response.team).toEqual(expect.objectContaining(teamShape));

      expect(Array.isArray(res.body.playersCreated)).toBe(true);

      expect(response.playersCreated.length).toEqual(20);

      response.playersCreated.forEach(player => {
        expect(player).toEqual(expect.objectContaining(playerShape));
      });
    });

    test("should return 401", async () => {
      const res = await request(app)
        .post("/v1/users/team")
        .set("Authorization", `Bearer fake_token`)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("GET /v1/users/team", () => {
    test("should register team and players and return user, team, and players data", async () => {
      const res = await request(app)
        .get("/v1/users/team")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      expect(res.status).toBe(httpStatus.OK);

      const response = res.body as GetTeamResponse;

      expect(response).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          budget: expect.any(Number),
          userId: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          Player: expect.arrayContaining([
            expect.objectContaining(playerShape),
          ]),
        })
      );
    });

    test("should return 401", async () => {
      const res = await request(app)
        .get("/v1/users/team")
        .set("Authorization", `Bearer fake_token`)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});
