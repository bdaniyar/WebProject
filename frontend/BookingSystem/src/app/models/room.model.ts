import { Hotel } from './hotel.model';

export interface Room {
  id: number;
  hotel: Hotel;
  price: number;
  capacity: number;
}
