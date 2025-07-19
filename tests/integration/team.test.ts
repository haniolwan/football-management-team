import { beforeAll, describe, expect, test } from "@jest/globals";
import httpStatus from "http-status";
import request from "supertest";
import app from "../../src/app";
import { Player, User } from "@prisma/client";
import { getAuthenticatedUser } from "../utils/authHelper";
import { playerShape, teamShape } from "../fixtures/player.matchers";
import {
  GetTeamResponse,
  RegisterTeamResponse,
} from "../../src/types/response";
import { beforeEach } from "node:test";
import { createDefaultPlayers, getCreatedPlayer } from "../utils/playerHelper";

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

      expect(response.playersCreated[0]).toEqual(
        expect.objectContaining(playerShape)
      );
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

  describe("GET /v1/players", () => {
    test("should get all listed players on market data", async () => {
      const res = await request(app)
        .get("/v1/players")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      expect(res.status).toBe(httpStatus.OK);

      const response = res.body as Player[] | [];
      expect(Array.isArray(response)).toBe(true);

      if (response.length === 0) {
        expect(response).toEqual([]);
      } else {
        expect(response.length).toBeGreaterThan(0);
        expect(response).toEqual(
          expect.arrayContaining([expect.objectContaining(playerShape)])
        );
      }
    });

    test("should return 401", async () => {
      const res = await request(app)
        .get("/v1/players")
        .set("Authorization", `Bearer fake_token`)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("POST /v1/players/list/:id", () => {
    let firstPlayer: Player;
    beforeAll(async () => {
      const players = await createDefaultPlayers(dbUser.id, dbUser.teamId);
      firstPlayer = players[0];
    });
    test("should list selected player to for sale market", async () => {
      const res = await request(app)
        .post(`/v1/players/list/${firstPlayer.id}`)
        .send({ askingPrice: 50000 })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);
      expect(res.status).toBe(httpStatus.OK);

      const playerResponse = res.body as Player;
      expect(playerResponse).toMatchObject(playerShape);
      expect(playerResponse.isListed).toEqual(true);
    });

    test("should return 404 if player not found", async () => {
      const res = await request(app)
        .post(`/v1/players/list/fakeId`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.NOT_FOUND);

      expect(res.body).toEqual(
        expect.objectContaining({
          code: 404,
          message: "Player not found",
        })
      );
    });

    test("should return 200 if player already listed", async () => {
      const res = await request(app)
        .post(`/v1/players/list/${firstPlayer.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      expect(res.status).toBe(httpStatus.OK);

      const playerResponse = res.body as Player;
      expect(playerResponse).toMatchObject(playerShape);
      expect(playerResponse.isListed).toEqual(true);
    });

    test("should return 401", async () => {
      const res = await request(app)
        .get("/v1/players")
        .set("Authorization", `Bearer fake_token`)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("POST /v1/players/unlist/:id", () => {
    let createdPlayer: Player;

    beforeAll(async () => {
      const { player } = await getCreatedPlayer(dbUser.id);
      createdPlayer = player;
    });

    test("should remove selected player from sales market", async () => {
      const res = await request(app)
        .post(`/v1/players/unlist/${createdPlayer.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      expect(res.status).toBe(httpStatus.OK);

      const playerResponse = res.body as Player;
      expect(playerResponse).toMatchObject(playerShape);
      expect(playerResponse.isListed).toEqual(false);
    });

    test("should return 404 if player not found", async () => {
      const res = await request(app)
        .post(`/v1/players/unlist/fakeId`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.NOT_FOUND);

      expect(res.body).toEqual(
        expect.objectContaining({
          code: 404,
          message: "Player not found",
        })
      );
    });

    test("should return 200 if player already unlisted", async () => {
      const res = await request(app)
        .post(`/v1/players/unlist/${createdPlayer.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      expect(res.status).toBe(httpStatus.OK);

      const playerResponse = res.body as Player;
      expect(playerResponse).toMatchObject(playerShape);
      expect(playerResponse.isListed).toEqual(false);
    });

    test("should return 401", async () => {
      const res = await request(app)
        .get("/v1/players")
        .set("Authorization", `Bearer fake_token`)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});
