import { Component, inject } from '@angular/core';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.css',
})
export class MyBookingsComponent {
  private readonly bookingApi = inject(BookingService);

  bookings: Booking[] = [];
  loading = false;
  error: string | null = null;

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
        this.error = e?.error?.detail || e?.message || 'Failed to load bookings.';
      },
    });
  }

  cancelBooking(id: number) {
    this.bookingApi.cancelBooking(id).subscribe({
      next: () => {
        this.bookings = this.bookings.filter((b) => b.id !== id);
      },
      error: (e: any) => {
        this.error = e?.error?.detail || e?.message || 'Failed to cancel booking.';
      },
    });
  }
}
