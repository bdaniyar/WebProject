import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../auth.service';
import { readApiError } from '../error.util';
import { HotelApiService } from '../hotel-api.service';
import { BookingPayload, Room } from '../models';

function addDays(offset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
}

@Component({
    selector: 'app-booking-composer',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './booking-composer.html',
    styleUrl: './booking-composer.css',
})
export class BookingComposerComponent implements OnInit {
    private readonly api = inject(HotelApiService);
    private readonly auth = inject(AuthService);

    @Input() title = 'Booking composer';
    @Input() subtitle = 'Create a reservation in a few clicks.';
    /** Optional hotel constraint; if provided - only rooms from this hotel are shown. */
    @Input() hotelId: number | null = null;

    @Output() bookingCreated = new EventEmitter<void>();

    rooms: Room[] = [];
    loadingRooms = false;
    saving = false;
    error = '';
    success = '';

    form: BookingPayload = {
        room_id: null,
        check_in: addDays(7),
        check_out: addDays(9),
        guests: 2,
        special_request: '',
    };

    ngOnInit() {
        this.loadRooms();
    }

    loadRooms() {
        this.loadingRooms = true;
        this.error = '';

        this.api.getRooms('', this.form.guests, this.hotelId ?? undefined).subscribe({
            next: (rooms) => {
                this.rooms = rooms;
            },
            error: (e) => {
                this.error = readApiError(e);
            },
            complete: () => {
                this.loadingRooms = false;
            },
        });
    }

    submit() {
        this.error = '';
        this.success = '';

        if (!this.auth.isAuthenticated()) {
            this.error = 'Please login to create a reservation.';
            return;
        }

        if (!this.form.room_id) {
            this.error = 'Please choose a room.';
            return;
        }

        if (!this.form.check_in || !this.form.check_out) {
            this.error = 'Please select dates.';
            return;
        }

        if (this.form.check_in >= this.form.check_out) {
            this.error = 'Check-out must be later than check-in.';
            return;
        }

        this.saving = true;

        this.api.createBooking(this.form).subscribe({
            next: () => {
                this.success = 'Reservation created.';
                this.bookingCreated.emit();
            },
            error: (e) => {
                this.error = readApiError(e);
            },
            complete: () => {
                this.saving = false;
            },
        });
    }
}
