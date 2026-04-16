import { Hotel } from './hotel.model';

export interface Amenity {
    id: number;
    name: string;
}

export interface Room {
    id: number;

    // DRF contract
    hotel: Hotel;
    price_per_night: number;
    total_units: number;
    available_units: number;
    amenities: Amenity[];

    capacity: number;

    // legacy field used by old templates (remove after migration)
    price?: number;
}
