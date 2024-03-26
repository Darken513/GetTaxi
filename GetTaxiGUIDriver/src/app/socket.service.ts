import { EventEmitter, Injectable } from '@angular/core';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any;
  public socketEvent: EventEmitter<any> = new EventEmitter<any>();
  constructor() { }

  public initSocket() {
    if (!this.socket) {
      this.socket = io('http://localhost:8080', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
    }
  }
  public canceledRide(data: any) {
    //todo
    this.emit('canceledRide', { rideId: data.rideId, isDriver: true });
  }
  public initRoomJoin(data: any) {
    if (!this.socket) {
      this.initSocket();
    }
    this.emit('joinRoom', { rideId: data.rideId, isDriver: true });
    this.socket.on('driverUpdate', (data: any) => {
      this.socketEvent.emit({
        event: "driverUpdate",
        data
      })
    });
    this.socket.on('clientUpdate', (data: any) => {
      this.socketEvent.emit({
        event: "clientUpdate",
        data
      })
    });
    this.socket.on('canceledRide', (data: any) => {
      this.socketEvent.emit({
        event: "canceledRide",
        data
      })
    });
  }
  public emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}
