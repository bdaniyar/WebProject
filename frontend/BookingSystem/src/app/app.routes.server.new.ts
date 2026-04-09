import { RenderMode, ServerRoute } from '@angular/ssr';

// Parameterized routes like `hotels/:id` can't be prerendered without getPrerenderParams.
// For a production app talking to a live API, render dynamically on the server.
export const serverRoutes: ServerRoute[] = [
    {
        path: '**',
        renderMode: RenderMode.Server,
    },
];
