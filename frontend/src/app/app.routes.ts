import { Routes } from '@angular/router';

import { DashboardPage } from './pages/dashboard/dashboard';
import { DiscoverPage } from './pages/discover/discover';
import { HotelDetailPage } from './pages/hotel-detail/hotel-detail';
import { HotelsPage } from './pages/hotels/hotels';
import { LoginPage } from './pages/login/login';
import { ProfilePage } from './pages/profile/profile';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'hotels' },

  // Hotels
  { path: 'discover', component: DiscoverPage },
  { path: 'hotels', component: HotelsPage },
  { path: 'hotels/:id', component: HotelDetailPage },

  // Bookings
  { path: 'bookings', component: DashboardPage },

  // Account
  { path: 'profile', component: ProfilePage },
  { path: 'login', component: LoginPage },

  { path: '**', redirectTo: 'hotels' },
];
