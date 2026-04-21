import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { FavoritesService } from './core/favorites.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesService);

  protected readonly user = this.auth.user;
  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly favoritesCount = this.favorites.count;
  protected readonly displayName = computed(() => {
    const currentUser = this.user();
    if (!currentUser) {
      return '';
    }

    const fullName = `${currentUser.first_name} ${currentUser.last_name}`.trim();
    return fullName || currentUser.username;
  });

  protected logout() {
    this.auth.logout().subscribe();
  }

  ngOnInit() {
    void this.favorites.refresh().subscribe();
  }
}
