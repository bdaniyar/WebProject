import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';

import { AuthService } from './auth.service';
import { Favorite } from './models';
import { FavoritesApiService } from './favorites-api.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = inject(FavoritesApiService);
  private readonly auth = inject(AuthService);

  readonly items = signal<Favorite[]>([]);
  readonly loading = signal(false);
  readonly count = computed(() => this.items().length);
  readonly hotelIdSet = computed(() => new Set(this.items().map((f) => f.hotel.id)));

  refresh(): Observable<Favorite[]> {
    if (!this.auth.isAuthenticated()) {
      this.items.set([]);
      return of([]);
    }

    this.loading.set(true);
    return this.api.list().pipe(
      tap((items) => this.items.set(items)),
      finalize(() => this.loading.set(false)),
      catchError(() => {
        // If anything fails (expired token etc), keep UI stable.
        this.items.set([]);
        return of([]);
      }),
    );
  }

  isFavorite(hotelId: number) {
    return this.hotelIdSet().has(hotelId);
  }

  add(hotelId: number): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      return of(void 0);
    }
    return this.api.add(hotelId).pipe(
      tap((fav) => {
        if (!this.isFavorite(hotelId)) {
          this.items.set([fav, ...this.items()]);
        }
      }),
      map(() => void 0),
    );
  }

  remove(hotelId: number): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      return of(void 0);
    }
    return this.api.remove(hotelId).pipe(
      tap(() => {
        this.items.set(this.items().filter((f) => f.hotel.id !== hotelId));
      }),
    );
  }

  toggle(hotelId: number): Observable<void> {
    return this.isFavorite(hotelId) ? this.remove(hotelId) : this.add(hotelId);
  }
}

