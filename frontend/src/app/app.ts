import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;
  protected readonly isAuthenticated = this.auth.isAuthenticated;
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
}
