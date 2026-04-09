import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { MyBookingsComponent } from './features/bookings/my-bookings/my-bookings.component';
import { HotelDetailComponent } from './features/hotels/hotel-detail/hotel-detail.component';
import { HotelListComponent } from './features/hotels/hotel-list/hotel-list.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'hotels' },
    { path: 'login', component: LoginComponent },
    { path: 'hotels', component: HotelListComponent },
    { path: 'hotels/:id', component: HotelDetailComponent },
    { path: 'bookings', component: MyBookingsComponent, canActivate: [authGuard] },
    { path: '**', component: NotFoundComponent },
];
