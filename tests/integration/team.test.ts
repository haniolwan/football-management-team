import { beforeAll, describe, expect, test } from "@jest/globals";
import httpStatus from "http-status";
import request from "supertest";
import app from "../../src/app";
import { Player, PositionType, User } from "@prisma/client";
import { getAuthenticatedUser } from "../utils/authHelper";
import { playerShape, teamShape } from "../fixtures/player.matchers";
import {
  GetTeamResponse,
  RegisterTeamResponse,
} from "../../src/types/response";
import {
  createDefaultPlayers,
  getCreatedPlayer,
  listPlayer,
} from "../utils/playerHelper";
import { teamOne } from "../fixtures/player.fixture";

describe("Team routes", () => {
  let accessToken: string;
  let dbUser: User;
  let createdPlayer: Player;

  beforeAll(async () => {
    const { token, user } = await getAuthenticatedUser();
    accessToken = token;
    dbUser = user;

    const { player } = await getCreatedPlayer(dbUser.id);
    createdPlayer = player;
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
    const PositionsMap: Record<PositionType, { value: number; max: number }> = {
      [PositionType.Goalkeeper]: { value: 0, max: 3 },
      [PositionType.Defender]: { value: 0, max: 6 },
      [PositionType.Midfielder]: { value: 0, max: 6 },
      [PositionType.Attacker]: { value: 0, max: 5 },
    };
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
          budget: 5000000,
          userId: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          Player: expect.arrayContaining([
            expect.objectContaining(playerShape),
          ]),
        })
      );

      response.Player.forEach(player => {
        const position = player.position;
        expect(Object.values(PositionType)).toContain(position);

        const { value, max } = PositionsMap[position];
        if (value !== max) {
          PositionsMap[position].value = value + 1;
        }
      });
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

    test("should get all listed players on market data: Filter by Name", async () => {
      const res = await request(app)
        .get(`/v1/players/?name=${createdPlayer.name}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);
      if (res.body.length === 0) {
        expect(res.body).toEqual([]);
      } else {
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toMatchObject({ ...playerShape, team: teamShape });
      }
    });

    test("should get all listed players on market data: Filter by Asking Price", async () => {
      const res = await request(app)
        .get(`/v1/players?sortBy=askingPrice&sortType=desc`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      const players = res.body as Player[];
      const prices = players.map(pl => pl.askingPrice);
      const sorted = [...prices].filter(a => a !== null).sort((a, b) => a - b);
      expect(res.status).toBe(httpStatus.OK);
      expect(prices).toEqual(sorted);
    });

    test("should get all listed players on market data: Filter by Team name", async () => {
      const res = await request(app)
        .get("/v1/players/?team_name=Fake_team")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      const players: Player[] = res.body;
      if (players.length === 0) {
        expect(players.length).toEqual(0);
      } else {
        players.forEach(pl => {
          expect(pl.teamId).toEqual(createdPlayer.teamId);
        });
      }
    });

    test("should return 400 For wrong query parameter", async () => {
      const res = await request(app)
        .get("/v1/players?unknown_query")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.BAD_REQUEST);

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.message).toEqual('"unknown_query" is not allowed');
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

      const playerResponse = res.body.data.player as Player;
      expect(playerResponse).toMatchObject(playerShape);
      expect(playerResponse.isListed).toEqual(true);
    });

    test("should return 400 if asking price is missing", async () => {
      const res = await request(app)
        .post(`/v1/players/list/fakeId`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.BAD_REQUEST);

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.message).toEqual('"askingPrice" is required');
    });

    test("should return 400 if asking price has invalid data", async () => {
      const res = await request(app)
        .post(`/v1/players/list/fakeId`)
        .send({
          askingPrice: "string",
        })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.BAD_REQUEST);

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.message).toEqual('"askingPrice" must be a number');
    });

    test("should return 400 if player not found", async () => {
      const res = await request(app)
        .post(`/v1/players/list/fakeId`)
        .send({
          askingPrice: 12000,
        })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.NOT_FOUND);

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body.message).toEqual("Player not found");
    });

    test("should return 200 if player already listed", async () => {
      const res = await request(app)
        .post(`/v1/players/list/${firstPlayer.id}`)
        .send({
          askingPrice: 12000,
        })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      expect(res.status).toBe(httpStatus.OK);

      const playerResponse = res.body.data.player as Player;
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

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body.message).toEqual("Player not found");
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
