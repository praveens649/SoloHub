import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import {
  fetchLatestRelease,
  getInstalledVersion,
  isNewerVersion,
  type GitHubRelease,
} from "../../lib/github/releases";
import {
  getCachedReleaseCheck,
  setCachedReleaseCheck,
  isReleaseDismissed,
  dismissRelease,
  postponeRelease,
  RELEASE_CACHE_TTL_MS,
} from "../../lib/storage/releases";

export interface ReleaseUpdateState {
  hasUpdate: boolean;
  installedVersion: string;
  latestVersion: string | null;
  release: GitHubRelease | null;
  isDismissed: boolean;
  isLoading: boolean;
  isChecking: boolean;
  rateLimited: boolean;
  error: string | null;
  dismiss: () => Promise<void>;
  postpone: (hours?: number) => Promise<void>;
  checkForUpdates: (force?: boolean) => Promise<void>;
}

export function useReleaseUpdate(): ReleaseUpdateState {
  const queryClient = useQueryClient();
  const installedVersion = getInstalledVersion();

  const query = useQuery({
    queryKey: ["releases", "latest"],
    queryFn: async () => {
      // 1. Check cache first
      const cached = await getCachedReleaseCheck();
      let releaseToEvaluate = cached?.release || null;

      if (!cached || Date.now() - cached.lastChecked >= RELEASE_CACHE_TTL_MS) {
        const auth = await getAuth();
        const { release, rateLimited, error } = await fetchLatestRelease(
          auth?.token
        );

        if (rateLimited) {
          return {
            release: null,
            latestVersion: null,
            hasUpdate: false,
            isDismissed: false,
            rateLimited: true,
            error: "GitHub API rate limit exceeded.",
          };
        }

        if (error) {
          return {
            release: null,
            latestVersion: null,
            hasUpdate: false,
            isDismissed: false,
            rateLimited: false,
            error,
          };
        }

        await setCachedReleaseCheck(release);
        releaseToEvaluate = release;
      }

      if (!releaseToEvaluate || !releaseToEvaluate.tag_name) {
        return {
          release: null,
          latestVersion: null,
          hasUpdate: false,
          isDismissed: false,
          rateLimited: false,
          error: null,
        };
      }

      const remoteVer = releaseToEvaluate.tag_name;
      const isNewer = isNewerVersion(remoteVer, installedVersion);

      if (!isNewer) {
        return {
          release: releaseToEvaluate,
          latestVersion: remoteVer,
          hasUpdate: false,
          isDismissed: false,
          rateLimited: false,
          error: null,
        };
      }

      const isDismissed = await isReleaseDismissed(remoteVer);

      return {
        release: releaseToEvaluate,
        latestVersion: remoteVer,
        hasUpdate: !isDismissed,
        isDismissed,
        rateLimited: false,
        error: null,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const dismiss = async () => {
    if (query.data?.latestVersion) {
      await dismissRelease(query.data.latestVersion);
      await queryClient.invalidateQueries({ queryKey: ["releases", "latest"] });
    }
  };

  const postpone = async (hours = 24) => {
    if (query.data?.latestVersion) {
      await postponeRelease(query.data.latestVersion, hours);
      await queryClient.invalidateQueries({ queryKey: ["releases", "latest"] });
    }
  };

  const checkForUpdates = async () => {
    const auth = await getAuth();
    const { release } = await fetchLatestRelease(auth?.token);
    await setCachedReleaseCheck(release);
    await queryClient.invalidateQueries({ queryKey: ["releases", "latest"] });
  };

  return {
    hasUpdate: query.data?.hasUpdate ?? false,
    installedVersion,
    latestVersion: query.data?.latestVersion ?? null,
    release: query.data?.release ?? null,
    isDismissed: query.data?.isDismissed ?? false,
    isLoading: query.isLoading,
    isChecking: query.isFetching,
    rateLimited: query.data?.rateLimited ?? false,
    error: query.data?.error ?? null,
    dismiss,
    postpone,
    checkForUpdates,
  };
}
