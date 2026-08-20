const EASY_PREFIX = 'easysoft:';

export function buildEasysoftRunId(runId: string): string {
  return `${EASY_PREFIX}${runId}`;
}

export function buildKiraManagedFilter() {
  return {
    fullSyncRunId: {
      $not: /^easysoft:/,
    },
  };
}

export function buildStaleEasysoftFilter(currentRunId: string) {
  return {
    fullSyncRunId: {
      $regex: /^easysoft:/,
      $ne: currentRunId,
    },
  };
}