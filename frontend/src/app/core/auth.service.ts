import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { AuthResponse, LoginPayload, RegisterPayload, UserProfile } from './models';

const ACCESS_KEY = 'hotel-booking.access';
const REFRESH_KEY = 'hotel-booking.refresh';
const USER_KEY = 'hotel-booking.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly accessToken = signal<string | null>(this.readStorage(ACCESS_KEY));
  readonly refreshToken = signal<string | null>(this.readStorage(REFRESH_KEY));
  readonly user = signal<UserProfile | null>(this.readStoredUser());
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login/`, payload).pipe(
      tap((response) => this.persistSession(response)),
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register/`, payload).pipe(
      tap((response) => this.persistSession(response)),
    );
  }

  logout(): Observable<void> {
    const refresh = this.refreshToken();
    if (!refresh) {
      this.clearSession();
      void this.router.navigate(['/hotels']);
      return of(void 0);
    }

    return this.http.post(`${API_BASE_URL}/auth/logout/`, { refresh }).pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
      tap(() => {
        this.clearSession();
        void this.router.navigate(['/hotels']);
      }),
    );
  }

  clearSession() {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
    this.removeStorage(ACCESS_KEY);
    this.removeStorage(REFRESH_KEY);
    this.removeStorage(USER_KEY);
  }

  private persistSession(response: AuthResponse) {
    this.accessToken.set(response.access);
    this.refreshToken.set(response.refresh);
    this.user.set(response.user);
    this.writeStorage(ACCESS_KEY, response.access);
    this.writeStorage(REFRESH_KEY, response.refresh);
    this.writeStorage(USER_KEY, JSON.stringify(response.user));
  }

  private readStoredUser(): UserProfile | null {
    const raw = this.readStorage(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  private readStorage(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(key);
  }

  private writeStorage(key: string, value: string) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(key, value);
  }

  private removeStorage(key: string) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(key);
  }
}
