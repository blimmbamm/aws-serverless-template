import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { getConfig } from './config';

export type PublicItem = {
  id: string;
  title: string;
  description: string;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  getHealth(): Observable<{ ok: boolean; service: string; db: string }> {
    return this.http.get<{ ok: boolean; service: string; db: string }>(this.url('/api/health'));
  }

  getPublicItems(): Observable<{ items: PublicItem[] }> {
    return this.http.get<{ items: PublicItem[] }>(this.url('/api/public/items'));
  }

  getMe(): Observable<{ user: unknown; message: string }> {
    return this.auth.idToken$().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('Not authenticated'));
        }
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });
        return this.http.get<{ user: unknown; message: string }>(this.url('/api/me'), { headers });
      }),
    );
  }

  private url(path: string): string {
    const base = getConfig().apiBaseUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }
}
