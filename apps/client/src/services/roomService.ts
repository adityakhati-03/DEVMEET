import api from './api';
import type { IRoom } from '@devmeet/shared';

interface RoomListResponse {
  success: true;
  data: { rooms: IRoom[] };
}

interface RoomResponse {
  success: true;
  data: { room: IRoom };
}

export const roomService = {
  async createRoom(data: { roomId: string } & import('@devmeet/shared').CreateRoomRequest): Promise<IRoom> {
    const res = await api.post<RoomResponse>('/api/rooms', data);
    return res.data.data.room;
  },

  async getRooms(): Promise<IRoom[]> {
    const res = await api.get<RoomListResponse>('/api/rooms');
    return res.data.data.rooms;
  },

  async getRoom(roomId: string): Promise<IRoom> {
    const res = await api.get<RoomResponse>(`/api/rooms/${roomId}`);
    return res.data.data.room;
  },

  async joinRoom(roomId: string): Promise<IRoom> {
    const res = await api.post<RoomResponse>(`/api/rooms/${roomId}/join`);
    return res.data.data.room;
  },

  async deleteRoom(roomId: string): Promise<void> {
    await api.delete(`/api/rooms/${roomId}`);
  },
};
