import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AboutPage } from './pages/about/about';
import { DashboardPage } from './pages/dashboard/dashboard';
import { HomePage } from './pages/home/home';
import { LoginPage } from './pages/login/login';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'about', component: AboutPage },
  { path: 'login', component: LoginPage },
  { path: 'app', component: DashboardPage, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
