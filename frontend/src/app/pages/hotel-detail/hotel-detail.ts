import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { readApiError } from '../../core/error.util';
import { HotelApiService } from '../../core/hotel-api.service';
import { BookingPayload, Hotel, Room } from '../../core/models';

@Component({
    selector: 'app-hotel-detail-page',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './hotel-detail.html',
    styleUrl: './hotel-detail.css',
})
export class HotelDetailPage implements OnInit {
    private readonly api = inject(HotelApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);

    readonly hotel = signal<Hotel | null>(null);
    readonly rooms = signal<Room[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly hotelId = computed(() => Number(this.route.snapshot.paramMap.get('id')) || 0);

    bookingForm: BookingPayload = {
        room_id: null,
        check_in: new Date().toISOString().slice(0, 10),
        check_out: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        guests: 2,
        special_request: '',
    };

    ngOnInit() {
        const id = this.hotelId();
        if (!id) {
            this.error.set('Invalid hotel id.');
            return;
        }

        this.loadHotel(id);
        this.loadRooms(id);
    }

    loadHotel(id: number) {
        this.loading.set(true);
        this.error.set('');

        this.api.getHotel(id).subscribe({
            next: (hotel) => this.hotel.set(hotel),
            error: (error) => this.error.set(readApiError(error)),
            complete: () => this.loading.set(false),
        });
    }

    loadRooms(id: number) {
        this.api.getRooms('', undefined, id).subscribe({
            next: (rooms) => this.rooms.set(rooms),
            error: (error) => this.error.set(readApiError(error)),
        });
    }

    bookNow(roomId: number) {
        if (!this.auth.isAuthenticated()) {
            void this.router.navigate(['/login']);
            return;
        }

        this.saving.set(true);
        this.error.set('');
        this.success.set('');

        this.api
            .createBooking({
                ...this.bookingForm,
                room_id: roomId,
            })
            .subscribe({
                next: () => {
                    this.success.set('Booking created. You can manage it in Bookings.');
                    void this.router.navigate(['/bookings']);
                },
                error: (error) => this.error.set(readApiError(error)),
                complete: () => this.saving.set(false),
            });
    }
}
