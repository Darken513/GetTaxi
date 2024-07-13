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
      this.socket = io('http://localhost:8080', { //todo-P2 : use env files
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
    }
  }

  public initRoomJoin(data: any) {
    if (!this.socket) {
      this.initSocket();
    }
    this.emit('joinRoom', { rideId: data.rideId, isDriver: false })
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
    this.socket.on('reachedClient', (data: any) => {
      this.socketEvent.emit({
        event: "reachedClient",
        data
      })
    });
  }

  public cancelRide(data: any) {
    this.emit('canceledRide', { rideId: data.rideId, isDriver: false });
  }

  public emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}
