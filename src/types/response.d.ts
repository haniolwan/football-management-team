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
    id: 0;
    name: "string";
    budget: 0;
    userId: 0;
  };
  players: [
    {
      id: 0;
      name: "string";
      position: "Goalkeeper";
      age: 0;
      nationality: "string";
      value: 0;
      rating: 0;
      teamId: 0;
    }
  ];
}
