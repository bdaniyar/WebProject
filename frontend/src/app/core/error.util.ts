export function readApiError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Unexpected error. Please try again.';
  }

  const payload = (error as { error?: unknown }).error;
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === 'string') {
      return detail;
    }

    for (const value of Object.values(payload as Record<string, unknown>)) {
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value)) {
        const firstString = value.find((item) => typeof item === 'string');
        if (typeof firstString === 'string') {
          return firstString;
        }
      }
    }
  }

  return 'Unexpected error. Please try again.';
}
