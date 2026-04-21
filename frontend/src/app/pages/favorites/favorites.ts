import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { FavoritesService } from '../../core/favorites.service';
import { readApiError } from '../../core/error.util';
import { Favorite } from '../../core/models';

@Component({
  selector: 'app-favorites-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class FavoritesPage implements OnInit {
  private readonly favorites = inject(FavoritesService);

  readonly items = this.favorites.items;
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.error.set('');
    this.favorites
      .refresh()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        error: (e) => this.error.set(readApiError(e)),
      });
  }

  remove(item: Favorite) {
    void this.favorites.remove(item.hotel.id).subscribe();
  }

  location(item: Favorite) {
    return [item.hotel.city, item.hotel.country].filter(Boolean).join(', ');
  }
}

