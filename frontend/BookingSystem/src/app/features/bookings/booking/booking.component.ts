import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';

@Component({
    selector: 'app-booking',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './booking.component.html',
    styleUrl: './booking.component.css',
})
export class BookingComponent {
    @Input({ required: true }) roomId!: number;

    private readonly bookingApi = inject(BookingService);
    private readonly auth = inject(AuthService);

    startDate = '';
    endDate = '';
    loading = false;
    message: string | null = null;
    error: string | null = null;
    readonly today = new Date().toISOString().split('T')[0];

    get invalidRange(): boolean {
        return !!this.startDate && !!this.endDate && this.endDate < this.startDate;
    }

    bookRoom() {
        this.message = null;
        this.error = null;

        if (!this.auth.isLoggedIn()) {
            this.error = 'Please login to book a room.';
            return;
        }

        if (!this.startDate || !this.endDate) {
            this.error = 'Please provide start and end dates.';
            return;
        }

        if (this.invalidRange) {
            this.error = 'End date must be on or after start date.';
            return;
        }

        this.loading = true;
        this.bookingApi
            .createBooking({ room: this.roomId, start_date: this.startDate, end_date: this.endDate })
            .subscribe({
                next: () => {
                    this.loading = false;
                    this.message = 'Booking created.';
                },
                error: (e: any) => {
                    this.loading = false;
                    this.error = e?.error?.detail || e?.message || 'Failed to book room.';
                },
            });
    }
}
