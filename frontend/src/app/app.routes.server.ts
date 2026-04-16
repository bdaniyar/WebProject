import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Dynamic routes can't be prerendered without getPrerenderParams.
  // Use SSR for everything to keep routing simple during development.
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
