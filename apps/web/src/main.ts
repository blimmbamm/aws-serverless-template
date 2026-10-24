import { bootstrapApplication } from '@angular/platform-browser';
import { switchMap } from 'rxjs';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { AuthService } from './app/core/auth.service';
import { loadConfig$ } from './app/core/config';

loadConfig$()
  .pipe(
    switchMap(() => bootstrapApplication(App, appConfig)),
    switchMap((app) => app.injector.get(AuthService).init$()),
  )
  .subscribe({
    error: (err) => console.error(err),
  });
