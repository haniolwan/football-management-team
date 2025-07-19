import { PositionType } from "@prisma/client";

export interface TokenResponse {
  token: string;
  expires: Date;
}

export interface AuthTokensResponse {
  access: TokenResponse;
  refresh?: TokenResponse;
}

export interface RegisterTeamResponse {
  user: User;
  team: Team;
  playersCreated: Player[];
}

export interface GetTeamResponse {
  Team: {
    id: number;
    name: string;
    budget: number;
    userId: number;
  };
  Player: [
    {
      id: string;
      name: string;
      position: PositionType;
      age: number;
      nationality: string;
      value: number;
      rating: number;
      teamId: number;
    }
  ];
}
