import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

type DashboardVm = {
  message: string | null;
  error: string | null;
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly vm$: Observable<DashboardVm> = this.api.getMe().pipe(
    map((res) => ({ message: res.message, error: null })),
    startWith({ message: null, error: null }),
    catchError((err: Error) => of({ message: null, error: err.message })),
  );

  signOut(): void {
    this.auth.signOut$().subscribe();
  }
}
