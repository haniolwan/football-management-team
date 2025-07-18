import request from "supertest";
import { faker } from "@faker-js/faker";
import httpStatus from "http-status";
import httpMocks from "node-mocks-http";
import moment from "moment";
import app from "../../src/app";
import config from "../../src/config/config";
import auth from "../../src/middlewares/auth";
import { tokenService } from "../../src/services";
import ApiError from "../../src/utils/ApiError";
import setupTestDB from "../utils/setupTestDb";
import { describe, beforeEach, test, expect, jest } from "@jest/globals";
import { userOne, admin, insertUsers } from "../fixtures/user.fixture";
import { Role, TokenType, User } from "@prisma/client";
import prisma from "../../src/client";
import { roleRights } from "../../src/config/roles";

setupTestDB();

describe("Auth routes", () => {
  describe("POST /v1/auth/register", () => {
    let newUser: { name: string; email: string; password: string };
    beforeEach(() => {
      newUser = {
        name: faker.name.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: "password1",
      };
    });

    test("should return 201 and successfully register user if request data is ok", async () => {
      const res = await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: newUser.name,
        email: newUser.email,
        role: Role.USER,
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: res.body.user.id },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({
        name: newUser.name,
        email: newUser.email,
        role: Role.USER,
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test("should return 400 error if email is invalid", async () => {
      newUser.email = "invalidEmail";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if email is already used", async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password length is less than 8 characters", async () => {
      newUser.password = "passwo1";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password does not contain both letters and numbers", async () => {
      newUser.password = "password";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      newUser.password = "11111111";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("POST /v1/auth/login", () => {
    test("should return 200 and login user if email and password match", async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.OK);

      expect(res.body.user).toMatchObject({
        id: expect.anything(),
        name: userOne.name,
        email: userOne.email,
      });

      expect(res.body.user).toEqual(
        expect.not.objectContaining({ password: expect.anything() })
      );

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test("should return 401 error if there are no users with that email", async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        code: httpStatus.UNAUTHORIZED,
        message: "Incorrect email or password",
      });
    });

    test("should return 401 error if password is wrong", async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: "wrongPassword1",
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        code: httpStatus.UNAUTHORIZED,
        message: "Incorrect email or password",
      });
    });
  });

  describe("POST /v1/auth/logout", () => {
    test("should return 204 if refresh token is valid", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const refreshToken = tokenService.generateToken(
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );
      await tokenService.saveToken(
        refreshToken,
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );

      await request(app)
        .post("/v1/auth/logout")
        .send({ refreshToken })
        .expect(httpStatus.NO_CONTENT);

      const dbRefreshTokenData = await prisma.token.findFirst({
        where: { token: refreshToken },
      });
      expect(dbRefreshTokenData).toBe(null);
    });

    test("should return 400 error if refresh token is missing from request body", async () => {
      await request(app)
        .post("/v1/auth/logout")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if refresh token is not found in the database", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const refreshToken = tokenService.generateToken(
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );

      await request(app)
        .post("/v1/auth/logout")
        .send({ refreshToken })
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 404 error if refresh token is blacklisted", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const refreshToken = tokenService.generateToken(
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );
      await tokenService.saveToken(
        refreshToken,
        dbUserOne.id,
        expires,
        TokenType.REFRESH,
        true
      );

      await request(app)
        .post("/v1/auth/logout")
        .send({ refreshToken })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("POST /v1/auth/refresh-tokens", () => {
    test("should return 200 and new auth tokens if refresh token is valid", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const refreshToken = tokenService.generateToken(
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );
      await tokenService.saveToken(
        refreshToken,
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );

      const res = await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbRefreshTokenData = await prisma.token.findFirst({
        where: { token: res.body.refresh.token },
        select: {
          type: true,
          userId: true,
          blacklisted: true,
        },
      });
      expect(dbRefreshTokenData).toMatchObject({
        type: TokenType.REFRESH,
        userId: dbUserOne.id,
        blacklisted: false,
      });

      const dbRefreshTokenCount = await prisma.token.count();
      expect(dbRefreshTokenCount).toBe(1);
    });

    test("should return 400 error if refresh token is missing from request body", async () => {
      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 error if refresh token is signed using an invalid secret", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const refreshToken = tokenService.generateToken(
        dbUserOne.id,
        expires,
        TokenType.REFRESH,
        "invalidSecret"
      );
      await tokenService.saveToken(
        refreshToken,
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if refresh token is not found in the database", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const refreshToken = tokenService.generateToken(
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if refresh token is blacklisted", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const refreshToken = tokenService.generateToken(
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );
      await tokenService.saveToken(
        refreshToken,
        dbUserOne.id,
        expires,
        TokenType.REFRESH,
        true
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if refresh token is expired", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().subtract(1, "minutes");
      const refreshToken = tokenService.generateToken(
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );
      await tokenService.saveToken(
        refreshToken,
        dbUserOne.id,
        expires,
        TokenType.REFRESH
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    // test('should return 401 error if user is not found', async () => {
    //   const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
    //   const refreshToken = tokenService.generateToken(dbUserOne.id, expires, TokenType.REFRESH);
    //   await tokenService.saveToken(refreshToken, dbUserOne.id, expires, TokenType.REFRESH);

    //   await request(app)
    //     .post('/v1/auth/refresh-tokens')
    //     .send({ refreshToken })
    //     .expect(httpStatus.UNAUTHORIZED);
    // });
  });
});

describe("Auth middleware", () => {
  test("should call next with no errors if access token is valid", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const userOneAccessToken = tokenService.generateToken(
      dbUserOne.id,
      moment().add(config.jwt.accessExpirationMinutes, "minutes"),
      TokenType.ACCESS
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect((req.user as User).id).toEqual(dbUserOne.id);
  });

  test("should call next with unauthorized error if access token is not found in header", async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if access token is not a valid jwt token", async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: "Bearer randomToken" },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if the token is not an access token", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const expires = moment().add(config.jwt.accessExpirationMinutes, "minutes");
    const refreshToken = tokenService.generateToken(
      dbUserOne.id,
      expires,
      TokenType.REFRESH
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if access token is generated with an invalid secret", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const expires = moment().add(config.jwt.accessExpirationMinutes, "minutes");
    const accessToken = tokenService.generateToken(
      dbUserOne.id,
      expires,
      TokenType.ACCESS,
      "invalidSecret"
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if access token is expired", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const expires = moment().subtract(1, "minutes");
    const accessToken = tokenService.generateToken(
      dbUserOne.id,
      expires,
      TokenType.ACCESS
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if user is not found", async () => {
    const userOneAccessToken = tokenService.generateToken(
      2000,
      moment().add(config.jwt.accessExpirationMinutes, "minutes"),
      TokenType.ACCESS
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with forbidden error if user does not have required rights and userId is not in params", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const userOneAccessToken = tokenService.generateToken(
      dbUserOne.id,
      moment().add(config.jwt.accessExpirationMinutes, "minutes"),
      TokenType.ACCESS
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = jest.fn();

    await auth("anyRight")(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.FORBIDDEN,
        message: "Forbidden",
      })
    );
  });

  test("should call next with no errors if user does not have required rights but userId is in params", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const userOneAccessToken = tokenService.generateToken(
      dbUserOne.id,
      moment().add(config.jwt.accessExpirationMinutes, "minutes"),
      TokenType.ACCESS
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
      params: { userId: dbUserOne.id },
    });
    const next = jest.fn();

    await auth("anyRight")(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test("should call next with no errors if user has required rights", async () => {
    await insertUsers([admin]);
    const dbAdmin = (await prisma.user.findUnique({
      where: { email: admin.email },
    })) as User;
    const adminAccessToken = tokenService.generateToken(
      dbAdmin.id,
      moment().add(config.jwt.accessExpirationMinutes, "minutes"),
      TokenType.ACCESS
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      params: { userId: dbAdmin.id },
    });
    const next = jest.fn();

    await auth(...(roleRights.get(Role.ADMIN) as string[]))(
      req,
      httpMocks.createResponse(),
      next
    );

    expect(next).toHaveBeenCalledWith();
  });
});
