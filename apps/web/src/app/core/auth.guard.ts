import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ready$.pipe(
    filter((ready) => ready),
    take(1),
    switchMap(() => auth.user$),
    take(1),
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};
