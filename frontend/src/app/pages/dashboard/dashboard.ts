import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { readApiError } from '../../core/error.util';
import { HotelApiService } from '../../core/hotel-api.service';
import { Booking, DashboardData, Room } from '../../core/models';

type BookingStatusFilter = 'all' | 'active' | 'completed' | 'cancelled';

function addDays(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(HotelApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly dashboard = signal<DashboardData | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly statusFilter = signal<BookingStatusFilter>('all');
  readonly bookingFilters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Past stays' },
    { value: 'cancelled', label: 'Cancelled' },
  ] as const;
  readonly bookingCounts = computed<Record<BookingStatusFilter, number>>(() => {
    const bookings = this.dashboard()?.bookings ?? [];
    return {
      all: bookings.length,
      active: bookings.filter(
        (booking) => booking.status === 'confirmed' || booking.status === 'checked_in',
      ).length,
      completed: bookings.filter((booking) => booking.status === 'completed').length,
      cancelled: bookings.filter((booking) => booking.status === 'cancelled').length,
    };
  });
  readonly filteredBookings = computed(() => {
    const bookings = this.dashboard()?.bookings ?? [];
    const filter = this.statusFilter();

    if (filter === 'all') {
      return bookings;
    }

    if (filter === 'active') {
      return bookings.filter(
        (booking) => booking.status === 'confirmed' || booking.status === 'checked_in',
      );
    }

    return bookings.filter((booking) => booking.status === filter);
  });
  readonly pastStays = computed(() =>
    (this.dashboard()?.bookings ?? []).filter((booking) => booking.status === 'completed'),
  );
  readonly upcomingStay = computed(() => {
    const activeBookings = (this.dashboard()?.bookings ?? [])
      .filter((booking) => booking.status === 'confirmed' || booking.status === 'checked_in')
      .sort((left, right) => {
        const dateOrder = left.check_in.localeCompare(right.check_in);
        if (dateOrder !== 0) {
          return dateOrder;
        }
        return right.created_at.localeCompare(left.created_at);
      });

    return activeBookings[0] ?? null;
  });
  readonly latestPastStay = computed(() => {
    const stays = [...this.pastStays()].sort((left, right) => {
      const dateOrder = right.check_out.localeCompare(left.check_out);
      if (dateOrder !== 0) {
        return dateOrder;
      }
      return right.created_at.localeCompare(left.created_at);
    });

    return stays[0] ?? null;
  });

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.refreshDashboard();
    }
  }

  get isAuthenticated() {
    return this.auth.isAuthenticated();
  }

  refreshDashboard() {
    this.loading.set(true);
    this.error.set('');

    this.api
      .getDashboard()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.dashboard.set(data),
        error: (error) => this.error.set(readApiError(error)),
      });
  }

  cancelBooking(bookingId: number) {
    this.error.set('');
    this.success.set('');

    this.api.cancelBooking(bookingId).subscribe({
      next: () => {
        this.success.set('Booking cancelled.');
        this.refreshDashboard();
      },
      error: (error) => this.error.set(readApiError(error)),
    });
  }

  setStatusFilter(filter: BookingStatusFilter) {
    this.statusFilter.set(filter);
  }

  filteredBookingsEmptyMessage() {
    if (this.statusFilter() === 'active') {
      return 'No active bookings yet.';
    }
    if (this.statusFilter() === 'completed') {
      return 'No past stays yet.';
    }
    if (this.statusFilter() === 'cancelled') {
      return 'No cancelled bookings yet.';
    }
    return 'No bookings yet. Create the first one from the form.';
  }

  canCancelBooking(booking: Booking) {
    return booking.status === 'confirmed' || booking.status === 'checked_in';
  }

  viewHotel(booking: Booking) {
    void this.router.navigate(['/hotels', booking.room.hotel.id], {
      queryParams: {
        guests: booking.guests,
        check_in: booking.check_in,
        check_out: booking.check_out,
      },
    });
  }

  goToLogin() {
    void this.router.navigate(['/login']);
  }

  goToHotels() {
    void this.router.navigate(['/hotels']);
  }

  showPastStays() {
    this.statusFilter.set('completed');
  }

  showActiveBookings() {
    this.statusFilter.set('active');
  }

  bookAgain(booking: Booking | null) {
    if (!booking) {
      return;
    }

    const stayLength = this.stayLength(booking);
    const checkIn = addDays(7);
    const checkOut = addDays(7 + stayLength);

    void this.router.navigate(['/hotels', booking.room.hotel.id], {
      queryParams: {
        guests: booking.guests,
        check_in: checkIn,
        check_out: checkOut,
      },
    });
  }

  openRecommendedRoom(room: Room) {
    void this.router.navigate(['/hotels', room.hotel.id], {
      queryParams: {
        guests: Math.min(room.capacity, 2),
        check_in: addDays(7),
        check_out: addDays(9),
      },
    });
  }

  private stayLength(booking: Booking) {
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const diff = checkOut.getTime() - checkIn.getTime();

    if (Number.isNaN(diff) || diff <= 0) {
      return 2;
    }

    return Math.max(Math.round(diff / (1000 * 60 * 60 * 24)), 1);
  }
}
