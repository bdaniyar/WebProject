import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, delay, map, of, tap } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { USE_MOCK_API } from '../constants/mock.constants';
import { LoginResponse } from '../models/user.model';
import { TokenService } from './token.service';

type AuthResult =
  | { ok: true; data: LoginResponse }
  | { ok: false; error: string };

interface MockUser {
  name: string;
  email: string;
  password: string;
}

const MOCK_USERS_KEY = 'mock_users';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  readonly isLoggedIn = signal<boolean>(this.tokenService.isLoggedIn());

  login(email: string, password: string) {
    if (USE_MOCK_API) {
      if (!email || !password) {
        return of({ ok: false as const, error: 'Email and password are required.' }).pipe(delay(200));
      }

      const users = this.readMockUsers();
      const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (!found || found.password !== password) {
        return of({ ok: false as const, error: 'Invalid email or password.' }).pipe(delay(300));
      }

      const res: LoginResponse = {
        access: `mock-jwt-token-${Date.now()}`,
        user: { id: 1, email: found.email, first_name: found.name },
      };

      return of<AuthResult>({ ok: true, data: res }).pipe(
        delay(250),
        tap(() => {
          this.tokenService.setAccessToken(res.access);
          this.isLoggedIn.set(true);
        }),
      );
    }

    return this.http
      .post<LoginResponse>(`${API_BASE_URL}login`, { email, password })
      .pipe(
        tap((res) => {
          if (res?.access) {
            this.tokenService.setAccessToken(res.access);
            this.isLoggedIn.set(true);
          }
        }),
        map((res): AuthResult => ({ ok: true, data: res })),
        catchError((err) => of({ ok: false as const, error: this.extractError(err) })),
      );
  }

  register(name: string, email: string, password: string) {
    if (USE_MOCK_API) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        return of({ ok: false as const, error: 'Name, email and password are required.' }).pipe(delay(220));
      }

      if (!email.includes('@')) {
        return of({ ok: false as const, error: 'Please enter a valid email address.' }).pipe(delay(220));
      }

      if (password.length < 6) {
        return of({ ok: false as const, error: 'Password must be at least 6 characters.' }).pipe(delay(220));
      }

      const users = this.readMockUsers();
      const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return of({ ok: false as const, error: 'This email is already registered.' }).pipe(delay(280));
      }

      users.push({ name: name.trim(), email: email.trim(), password });
      this.writeMockUsers(users);

      const res: LoginResponse = {
        access: `mock-jwt-token-${Date.now()}`,
        user: { id: users.length, email: email.trim(), first_name: name.trim() },
      };

      return of<AuthResult>({ ok: true, data: res }).pipe(
        delay(320),
        tap(() => {
          this.tokenService.setAccessToken(res.access);
          this.isLoggedIn.set(true);
        }),
      );
    }

    return this.http
      .post<LoginResponse>(`${API_BASE_URL}register`, { name, email, password })
      .pipe(
        tap((res) => {
          if (res?.access) {
            this.tokenService.setAccessToken(res.access);
            this.isLoggedIn.set(true);
          }
        }),
        map((res): AuthResult => ({ ok: true, data: res })),
        catchError((err) => of({ ok: false as const, error: this.extractError(err) })),
      );
  }

  logout(): void {
    this.tokenService.clear();
    this.isLoggedIn.set(false);
    void this.router.navigate(['/login']);
  }

  private readMockUsers(): MockUser[] {
    if (typeof localStorage === 'undefined') {
      return [{ name: 'Demo User', email: 'demo@hotel.com', password: '123456' }];
    }

    try {
      const value = localStorage.getItem(MOCK_USERS_KEY);
      if (value) {
        return JSON.parse(value) as MockUser[];
      }
    } catch {
      // Fallback to default user in invalid storage states.
    }

    return [{ name: 'Demo User', email: 'demo@hotel.com', password: '123456' }];
  }

  private writeMockUsers(users: MockUser[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  }

  private extractError(err: unknown): string {
    const anyErr = err as any;
    return (
      anyErr?.error?.detail ||
      anyErr?.error?.message ||
      anyErr?.message ||
      'Request failed. Please try again.'
    );
  }
}
