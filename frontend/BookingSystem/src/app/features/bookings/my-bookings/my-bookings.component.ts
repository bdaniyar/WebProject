import { Component, inject } from '@angular/core';

import { Booking } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { HttpErrorService } from '../../../core/services/http-error.service';

@Component({
    selector: 'app-my-bookings',
    standalone: true,
    templateUrl: './my-bookings.component.html',
    styleUrl: './my-bookings.component.css',
})
export class MyBookingsComponent {
    private readonly bookingApi = inject(BookingService);
    private readonly httpError = inject(HttpErrorService);

    bookings: Booking[] = [];
    loading = false;
    error: string | null = null;
    cancellingId: number | null = null;

    ngOnInit() {
        this.loadMyBookings();
    }

    loadMyBookings() {
        this.loading = true;
        this.error = null;

        this.bookingApi.getMyBookings().subscribe({
            next: (data) => {
                this.bookings = data;
                this.loading = false;
            },
            error: (e: any) => {
                this.loading = false;
                this.error = this.httpError.toMessage(e, 'Failed to load bookings.');
            },
        });
    }

    cancelBooking(id: number) {
        this.error = null;
        this.cancellingId = id;

        this.bookingApi.cancelBooking(id).subscribe({
            next: () => {
                this.bookings = this.bookings.filter((b) => b.id !== id);
                this.cancellingId = null;
            },
            error: (e: any) => {
                this.cancellingId = null;
                this.error = this.httpError.toMessage(e, 'Failed to cancel booking.');
            },
        });
    }
}
