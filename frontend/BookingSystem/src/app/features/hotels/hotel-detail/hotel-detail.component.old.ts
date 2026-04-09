import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HotelService } from '../../../core/services/hotel.service';
import { RoomService } from '../../../core/services/room.service';
import { Hotel } from '../../../core/models/hotel.model';
import { Room } from '../../../core/models/room.model';
import { BookingComponent } from '../../bookings/booking/booking.component';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [RouterLink, BookingComponent],
  templateUrl: './hotel-detail.component.html',
  styleUrl: './hotel-detail.component.css',
})
export class HotelDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly hotelsApi = inject(HotelService);
  private readonly roomsApi = inject(RoomService);

  hotel: Hotel | null = null;
  rooms: Room[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Invalid hotel id.';
      return;
    }
    this.load(id);
  }

  private load(id: number) {
    this.loading = true;
    this.error = null;

    this.hotelsApi.getHotel(id).subscribe({
      next: (h) => {
        this.hotel = h;
        this.loading = false;
      },
      error: (e: Error) => {
        this.loading = false;
        this.error = e.message || 'Failed to load hotel.';
      },
    });

    this.roomsApi.getRoomsByHotel(id).subscribe({
      next: (data) => (this.rooms = data),
      error: (e: any) => (this.error = e?.message || 'Failed to load rooms.'),
    });
  }
}
