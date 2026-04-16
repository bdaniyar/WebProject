import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav>
      <a routerLink="/">Home</a>
      <a routerLink="/hotels">Hotels</a>
      <a routerLink="/bookings">Bookings</a>
      <a routerLink="/profile">Profile</a>
      <a routerLink="/login">Login</a>
    </nav>
  `,
  styles: [
    `
      nav {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid #ddd;
      }

      a {
        text-decoration: none;
        color: #1f2937;
      }
    `,
  ],
})
export class NavbarComponent {}
