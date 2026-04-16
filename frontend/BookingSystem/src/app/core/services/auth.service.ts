import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, delay, map, of, tap } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { USE_MOCK_API } from '../constants/mock.constants';
import { LoginResponse, User } from '../models/user.model';
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
const CURRENT_USER_KEY = 'current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  readonly isLoggedIn = signal<boolean>(this.tokenService.isLoggedIn());
  readonly currentUser = signal<User | null>(this.readStoredCurrentUser());

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
          this.setCurrentUser(res.user ?? null);
        }),
      );
    }

    return this.http
      .post<LoginResponse>(`${API_BASE_URL}auth/login/`, { username: email, password })
      .pipe(
        tap((res) => {
          if (res?.access) {
            this.tokenService.setAccessToken(res.access);
            this.isLoggedIn.set(true);
            this.setCurrentUser(res.user ?? null);
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
          this.setCurrentUser(res.user ?? null);
        }),
      );
    }

    return this.http
      .post<LoginResponse>(`${API_BASE_URL}auth/register/`, { username: email, email, password, first_name: name })
      .pipe(
        tap((res) => {
          if (res?.access) {
            this.tokenService.setAccessToken(res.access);
            this.isLoggedIn.set(true);
            this.setCurrentUser(res.user ?? null);
          }
        }),
        map((res): AuthResult => ({ ok: true, data: res })),
        catchError((err) => of({ ok: false as const, error: this.extractError(err) })),
      );
  }

  logout(): void {
    this.tokenService.clear();
    this.isLoggedIn.set(false);
    this.setCurrentUser(null);
    void this.router.navigate(['/login']);
  }

  getCurrentUser() {
    if (USE_MOCK_API) {
      if (!this.isLoggedIn()) {
        return of({ ok: false as const, error: 'You are not authenticated.' }).pipe(delay(180));
      }

      const existing = this.currentUser();
      if (existing) {
        return of({ ok: true as const, data: existing }).pipe(delay(180));
      }

      const demoUser: User = { id: 1, email: 'demo@hotel.com', first_name: 'Demo User' };
      this.setCurrentUser(demoUser);
      return of({ ok: true as const, data: demoUser }).pipe(delay(180));
    }

    return this.http.get<User>(`${API_BASE_URL}user/me/`).pipe(
      tap((user) => this.setCurrentUser(user)),
      map((user) => ({ ok: true as const, data: user })),
      catchError((err) => of({ ok: false as const, error: this.extractError(err) })),
    );
  }

  updateProfile(name: string, email: string) {
    if (!name.trim() || !email.trim()) {
      return of({ ok: false as const, error: 'Name and email are required.' }).pipe(delay(180));
    }

    if (!email.includes('@')) {
      return of({ ok: false as const, error: 'Please enter a valid email address.' }).pipe(delay(180));
    }

    return this.http
      .put<User>(`${API_BASE_URL}user/me/`, { first_name: name.trim(), email: email.trim() })
      .pipe(
        tap((user) => this.setCurrentUser(user)),
        map((user) => ({ ok: true as const, data: user })),
        catchError((err) => of({ ok: false as const, error: this.extractError(err) })),
      );
  }

  changePassword(currentPassword: string, newPassword: string) {
    if (!currentPassword.trim() || !newPassword.trim()) {
      return of({ ok: false as const, error: 'Both password fields are required.' }).pipe(delay(180));
    }

    if (newPassword.length < 6) {
      return of({ ok: false as const, error: 'New password must be at least 6 characters.' }).pipe(delay(180));
    }

    return this.http
      .post(`${API_BASE_URL}user/change-password/`, {
        current_password: currentPassword,
        new_password: newPassword,
      })
      .pipe(
        map(() => ({ ok: true as const })),
        catchError((err) => of({ ok: false as const, error: this.extractError(err) })),
      );
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

  private readStoredCurrentUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const value = localStorage.getItem(CURRENT_USER_KEY);
      return value ? (JSON.parse(value) as User) : null;
    } catch {
      return null;
    }
  }

  private setCurrentUser(user: User | null): void {
    this.currentUser.set(user);
    if (typeof localStorage === 'undefined') return;
    if (!user) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return;
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
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
