import { Routes } from '@angular/router';

import { DashboardPage } from './pages/dashboard/dashboard';
import { DiscoverPage } from './pages/discover/discover';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password';
import { FavoritesPage } from './pages/favorites/favorites';
import { HotelDetailPage } from './pages/hotel-detail/hotel-detail';
import { HotelsPage } from './pages/hotels/hotels';
import { LoginPage } from './pages/login/login';
import { MapPage } from './pages/map/map';
import { ProfilePage } from './pages/profile/profile';
import { ResetPasswordPage } from './pages/reset-password/reset-password';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'hotels' },

  // Hotels
  { path: 'discover', component: DiscoverPage },
  { path: 'hotels', component: HotelsPage },
  { path: 'hotels/:id', component: HotelDetailPage },
  { path: 'favorites', component: FavoritesPage },
  { path: 'map', component: MapPage },

  // Bookings
  { path: 'bookings', component: DashboardPage },

  // Account
  { path: 'profile', component: ProfilePage },
  { path: 'login', component: LoginPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'reset-password', component: ResetPasswordPage },

  { path: '**', redirectTo: 'hotels' },
];
