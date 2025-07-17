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
