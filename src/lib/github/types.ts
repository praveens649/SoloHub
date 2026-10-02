export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GitHubAuthState {
  authenticated: boolean;
  user: GitHubUser | null;
}