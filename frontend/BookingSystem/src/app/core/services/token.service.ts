import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const ACCESS_TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly platformId = inject(PLATFORM_ID);

  private get canUseStorage(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getAccessToken(): string | null {
    if (!this.canUseStorage) return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    if (!this.canUseStorage) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  clear(): void {
    if (!this.canUseStorage) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}
