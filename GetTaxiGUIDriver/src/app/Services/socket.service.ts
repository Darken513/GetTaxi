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
      this.socket = io('http://localhost:8080', { //todo-P3 : use env files
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
    }
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
    this.socket.on('clientHeartBeat', (data: any) => {
      this.socketEvent.emit({
        event: "clientHeartBeat",
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

  public cancelRide(rideId: any) {
    this.emit('canceledRide', { rideId, isDriver: true });
  }
  
  public emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}
