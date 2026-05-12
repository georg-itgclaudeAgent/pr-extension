import { useState, useEffect } from "react";
import {
  fetchLatestExtensionRelease,
  fetchInstalledVersion,
  compareSemver,
  ReleaseInfo,
} from "../api/githubReleases";

const DISMISSED_KEY = "pr-extension-dismissed-update-version";
const LAST_CHECK_KEY = "pr-extension-last-update-check";

export type UpdateState =
  | { status: "checking" }
  | { status: "up-to-date" }
  | { status: "available"; installed: string; latest: ReleaseInfo; dismissed: boolean }
  | { status: "error"; reason: string };

export interface UseUpdateCheckResult {
  state: UpdateState;
  /** Mark the latest version as dismissed permanently. */
  dismiss: () => void;
  /** Force a re-check (e.g. after user clicks NEW! pill). */
  recheck: () => void;
}

function readDismissed(): string | null {
  try { return localStorage.getItem(DISMISSED_KEY); } catch (_) { return null; }
}

function writeDismissed(v: string): void {
  try { localStorage.setItem(DISMISSED_KEY, v); } catch (_) {}
}

export function useUpdateCheck(): UseUpdateCheckResult {
  const [state, setState] = useState<UpdateState>({ status: "checking" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [installed, latest] = await Promise.all([
        fetchInstalledVersion(),
        fetchLatestExtensionRelease(),
      ]);
      if (cancelled) return;

      try { localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString()); } catch (_) {}

      if (!installed) {
        setState({ status: "error", reason: "Could not read installed version" });
        return;
      }
      if (!latest) {
        setState({ status: "error", reason: "Could not fetch latest release" });
        return;
      }

      if (compareSemver(latest.version, installed) <= 0) {
        setState({ status: "up-to-date" });
        return;
      }

      const dismissedVersion = readDismissed();
      const dismissed = dismissedVersion === latest.version;
      setState({ status: "available", installed, latest, dismissed });
    })();

    return () => { cancelled = true; };
  }, [tick]);

  const dismiss = () => {
    if (state.status === "available") {
      writeDismissed(state.latest.version);
      setState({ ...state, dismissed: true });
    }
  };

  const recheck = () => setTick((t) => t + 1);

  return { state, dismiss, recheck };
}
