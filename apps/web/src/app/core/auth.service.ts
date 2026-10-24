import { Injectable } from '@angular/core';
import { Amplify } from 'aws-amplify';
import {
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from 'aws-amplify/auth';
import {
  BehaviorSubject,
  Observable,
  catchError,
  defer,
  from,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { getConfig } from './config';

export type AuthUser = {
  email: string;
  sub: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);
  private readonly readySubject = new BehaviorSubject<boolean>(false);

  readonly user$ = this.userSubject.asObservable();
  readonly ready$ = this.readySubject.asObservable();
  readonly isAuthenticated$ = this.user$.pipe(map((user) => user !== null));

  private cognitoConfigured = false;

  init$(): Observable<void> {
    return defer(() => {
      const config = getConfig();

      if (config.userPoolId && config.userPoolClientId) {
        Amplify.configure({
          Auth: {
            Cognito: {
              userPoolId: config.userPoolId,
              userPoolClientId: config.userPoolClientId,
            },
          },
        });
        this.cognitoConfigured = true;

        return from(getCurrentUser()).pipe(
          switchMap(() => this.readSessionUser$()),
          tap((user) => this.userSubject.next(user)),
          map(() => undefined),
          catchError(() => of(undefined)),
        );
      }

      if (config.devAuth) {
        const raw = localStorage.getItem('dev-auth-user');
        if (raw) {
          this.userSubject.next(JSON.parse(raw) as AuthUser);
        }
      }

      return of(undefined);
    }).pipe(
      tap({
        next: () => this.readySubject.next(true),
        error: () => this.readySubject.next(true),
      }),
      map(() => undefined),
    );
  }

  idToken$(): Observable<string | null> {
    return defer(() => {
      const config = getConfig();

      if (!this.cognitoConfigured) {
        if (config.devAuth && this.userSubject.value) {
          return of('dev' as string | null);
        }
        return of(null);
      }

      return from(fetchAuthSession()).pipe(
        map((session) => session.tokens?.idToken?.toString() ?? null),
        catchError(() => of(null)),
      );
    });
  }

  signUp$(email: string, password: string): Observable<void> {
    if (!this.cognitoConfigured) {
      return this.devSignIn$(email);
    }

    return from(
      amplifySignUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      }),
    ).pipe(map(() => undefined));
  }

  confirmSignUp$(email: string, code: string): Observable<void> {
    if (!this.cognitoConfigured) {
      return of(undefined);
    }

    return from(
      amplifyConfirmSignUp({
        username: email,
        confirmationCode: code,
      }),
    ).pipe(map(() => undefined));
  }

  signIn$(email: string, password: string): Observable<void> {
    if (!this.cognitoConfigured) {
      return this.devSignIn$(email);
    }

    return from(amplifySignIn({ username: email, password })).pipe(
      switchMap(() => this.readSessionUser$(email)),
      tap((user) => this.userSubject.next(user)),
      map(() => undefined),
    );
  }

  signOut$(): Observable<void> {
    const clearLocal = () => {
      localStorage.removeItem('dev-auth-user');
      this.userSubject.next(null);
    };

    if (!this.cognitoConfigured) {
      clearLocal();
      return of(undefined);
    }

    return from(amplifySignOut()).pipe(
      catchError(() => of(undefined)),
      tap(() => clearLocal()),
      map(() => undefined),
    );
  }

  private readSessionUser$(fallbackEmail = ''): Observable<AuthUser> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const payload = session.tokens?.idToken?.payload ?? {};
        return {
          email: String(payload['email'] ?? fallbackEmail),
          sub: String(payload['sub'] ?? ''),
        };
      }),
    );
  }

  private devSignIn$(email: string): Observable<void> {
    const next: AuthUser = { email, sub: 'dev-user' };
    localStorage.setItem('dev-auth-user', JSON.stringify(next));
    this.userSubject.next(next);
    return of(undefined);
  }
}
