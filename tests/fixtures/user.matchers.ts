import { expect } from "@jest/globals";

export const teamShape = {
  id: expect.anything(),
  name: expect.any(String),
  budget: 5000000,
  userId: expect.any(Number),
};

export const playerShape = {
  id: expect.any(String),
  name: expect.any(String),
  position: expect.any(String),
  age: expect.any(Number),
  nationality: expect.any(String),
  value: expect.any(Number),
  rating: expect.any(Number),
  teamId: expect.any(Number),
};
