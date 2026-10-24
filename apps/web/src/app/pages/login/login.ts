import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, catchError, from, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { getConfig } from '../../core/config';

type LoginMode = 'signin' | 'signup' | 'confirm';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, AsyncPipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  email = '';
  password = '';
  confirmCode = '';

  private readonly modeSubject = new BehaviorSubject<LoginMode>('signin');
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly infoSubject = new BehaviorSubject<string | null>(null);

  readonly mode$ = this.modeSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly info$ = this.infoSubject.asObservable();
  readonly devAuth = getConfig().devAuth && !getConfig().userPoolId;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  setMode(mode: LoginMode): void {
    this.modeSubject.next(mode);
  }

  submit(): void {
    this.errorSubject.next(null);
    this.infoSubject.next(null);

    this.runSubmit$()
      .pipe(
        catchError((err: unknown) => {
          this.errorSubject.next(err instanceof Error ? err.message : String(err));
          return of(undefined);
        }),
      )
      .subscribe();
  }

  private runSubmit$(): Observable<void> {
    const mode = this.modeSubject.value;

    if (mode === 'signin') {
      return this.auth.signIn$(this.email, this.password || 'dev').pipe(
        switchMap(() => from(this.router.navigateByUrl('/app'))),
        map(() => undefined),
      );
    }

    if (mode === 'signup') {
      return this.auth.signUp$(this.email, this.password).pipe(
        switchMap(() => {
          if (this.devAuth) {
            return from(this.router.navigateByUrl('/app')).pipe(map(() => undefined));
          }
          this.modeSubject.next('confirm');
          this.infoSubject.next('Check your email for a confirmation code.');
          return of(undefined);
        }),
      );
    }

    return this.auth.confirmSignUp$(this.email, this.confirmCode).pipe(
      tap(() => {
        this.modeSubject.next('signin');
        this.infoSubject.next('Confirmed — you can sign in now.');
      }),
    );
  }
}
