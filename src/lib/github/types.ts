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
export interface GitHubOrganization {
  id: number;
  login: string;
  avatar_url: string;
  description: string | null;
  url?: string;
  html_url?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
    type?: string;
  };
  organization?: {
    login: string;
    avatar_url?: string;
  };
}

export type CollaboratorPermission =
  | "pull"
  | "triage"
  | "push"
  | "maintain"
  | "admin";

export interface GitHubCollaborator {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  permissions?: {
    admin?: boolean;
    maintain?: boolean;
    push?: boolean;
    triage?: boolean;
    pull?: boolean;
  };
  role_name?: string;
}

export interface GitHubCollaboratorInvitation {
  id: number;
  repository?: {
    name: string;
    full_name: string;
  };
  invitee?: {
    login: string;
    avatar_url: string;
  };
  inviter?: {
    login: string;
  };
  permissions?: string;
  created_at?: string;
  html_url?: string;
}