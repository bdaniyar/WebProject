import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [RouterLink],
    template: `
    <div class="container">
      <h2>Page not found</h2>
      <a routerLink="/hotels">Go to hotels</a>
    </div>
  `,
    styles: [
        `
      .container {
        max-width: 900px;
        margin: 2rem auto;
        padding: 0 1rem;
      }
    `,
    ],
})
export class NotFoundComponent { }
