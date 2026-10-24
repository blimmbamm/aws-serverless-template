import { Observable, from, of, shareReplay, switchMap, throwError } from 'rxjs';

export type AppConfig = {
  apiBaseUrl: string;
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  devAuth: boolean;
};

let cached: AppConfig | null = null;

export function loadConfig$(): Observable<AppConfig> {
  if (cached) {
    return of(cached);
  }

  return from(fetch('/config.json', { cache: 'no-store' })).pipe(
    switchMap((res) => {
      if (!res.ok) {
        return throwError(() => new Error(`Failed to load config.json (${res.status})`));
      }
      return from(res.json() as Promise<AppConfig>);
    }),
    switchMap((config) => {
      cached = config;
      return of(config);
    }),
    shareReplay(1),
  );
}

/** Sync access after `loadConfig$()` has completed (e.g. post-bootstrap). */
export function getConfig(): AppConfig {
  if (!cached) {
    throw new Error('Config not loaded yet');
  }
  return cached;
}
