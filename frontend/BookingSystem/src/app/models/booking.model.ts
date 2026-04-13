import { Room } from './room.model';
import { User } from './user.model';

export interface Booking {
  id: number;
  user: User;
  room: Room;
  start_date: string;
  end_date: string;
}
