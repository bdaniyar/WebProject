import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { MyBookingsComponent } from './features/bookings/my-bookings/my-bookings.component';
import { HomeComponent } from './features/home/home.component';
import { HotelDetailComponent } from './features/hotels/hotel-detail/hotel-detail.component';
import { HotelListComponent } from './features/hotels/hotel-list/hotel-list.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'hotels', component: HotelListComponent },
  { path: 'hotels/:id', component: HotelDetailComponent },
  { path: 'bookings', component: MyBookingsComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent },
];
