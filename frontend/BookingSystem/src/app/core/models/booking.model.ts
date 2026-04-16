import { Room } from './room.model';

export interface Booking {
    id: number;

    // DRF contract
    room: Room;
    check_in: string; // ISO date
    check_out: string; // ISO date
    guests: number;
    status: string;
    total_price: number;

    // legacy / transitional fields (remove after UI migration)
    start_date?: string;
    end_date?: string;
}

export interface CreateBookingRequest {
    room_id: number;
    check_in: string;
    check_out: string;
    guests: number;
}
