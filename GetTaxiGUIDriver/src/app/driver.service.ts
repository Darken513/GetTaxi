import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DriverService {

  private apiUrl = 'http://localhost:8080/driver'; //todo-P2 : use env files

  constructor(
    private http: HttpClient
  ) { }

  public getDriverById(driverId: string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getDriverById/${driverId}`);
  }
  public getCarByID(carId: string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getCarByID/${carId}`);
  }
  public getZoneById(zoneId: string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getZoneById/${zoneId}`);
  }
  public getRideById(rideId: string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getRideById/${rideId}`);
  }
  public acceptRide(rideId: string, driverId: string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/acceptRide/${rideId}/${driverId}`);
  }
  public cancelRide(rideId: string, driverId: string, reason:any): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/cancelRide/${rideId}`, {reason, driverId});
  }
}
