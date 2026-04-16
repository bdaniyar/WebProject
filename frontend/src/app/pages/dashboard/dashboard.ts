import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { readApiError } from '../../core/error.util';
import { HotelApiService } from '../../core/hotel-api.service';
import { Booking, BookingPayload, DashboardData, Room } from '../../core/models';

function addDays(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(HotelApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly dashboard = signal<DashboardData | null>(null);
  readonly rooms = signal<Room[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  editingBookingId: number | null = null;
  bookingForm: BookingPayload = this.createEmptyForm();

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.refreshDashboard();
      this.loadRooms();
    }
  }

  get isAuthenticated() {
    return this.auth.isAuthenticated();
  }

  refreshDashboard() {
    this.loading.set(true);
    this.error.set('');

    this.api.getDashboard().subscribe({
      next: (data) => this.dashboard.set(data),
      error: (error) => this.error.set(readApiError(error)),
      complete: () => this.loading.set(false),
    });
  }

  loadRooms() {
    this.api.getRooms('', this.bookingForm.guests).subscribe({
      next: (rooms) => this.rooms.set(rooms),
      error: (error) => this.error.set(readApiError(error)),
    });
  }

  submitBooking() {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    if (!this.bookingForm.room_id) {
      this.error.set('Choose a room before saving the booking.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const request$ = this.editingBookingId
      ? this.api.updateBooking(this.editingBookingId, this.bookingForm)
      : this.api.createBooking(this.bookingForm);

    request$.subscribe({
      next: () => {
        this.success.set(this.editingBookingId ? 'Booking updated.' : 'Booking created.');
        this.refreshDashboard();
        this.resetForm();
      },
      error: (error) => this.error.set(readApiError(error)),
      complete: () => this.saving.set(false),
    });
  }

  startEdit(booking: Booking) {
    this.editingBookingId = booking.id;
    this.bookingForm = {
      room_id: booking.room.id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      guests: booking.guests,
      special_request: booking.special_request,
    };
    this.success.set('Editing selected booking.');
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

  chooseRoom(roomId: number) {
    this.bookingForm = { ...this.bookingForm, room_id: roomId };
    this.success.set('Room selected for the booking form.');
  }

  resetForm() {
    this.editingBookingId = null;
    this.bookingForm = this.createEmptyForm();
  }

  selectedRoom(): Room | undefined {
    return this.rooms().find((room) => room.id === this.bookingForm.room_id);
  }

  goToLogin() {
    void this.router.navigate(['/login']);
  }

  goToHotels() {
    void this.router.navigate(['/hotels']);
  }

  private createEmptyForm(): BookingPayload {
    return {
      room_id: null,
      check_in: addDays(5),
      check_out: addDays(7),
      guests: 2,
      special_request: '',
    };
  }
}
