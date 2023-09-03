export interface GithubTagRes {
  name: string;
  zipball_url: string;
  tarball_url: string;
  commit: {
    sha: string;
    url: string;
  };
  node_id: string;
}

export interface GithubReposRes {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  html_url: string;
  size: number;
}
