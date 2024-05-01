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
  public getCarBrandByID(carId: string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getCarBrandByID/${carId}`);
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
  public cancelRide(rideId: string, driverId: string, reason: any): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/cancelRide/${rideId}`, { reason, driverId });
  }
  public updateDriver(def: any, id: string): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/updateDriver/${id}`, def);
  }
  public uploadDriversFiles(formData: FormData, fileKey: any, driverId: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/uploadFile/${driverId}/${fileKey}`, formData);
  }
  public readDriverFilesURLS(filePath: any, driverId: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/readFileURL/${driverId}/${filePath}`);
  }
  public getAllZones(): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getAllZones`);
  }
  public getAllCarTypes(): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getAllCarTypes`);
  }
  public getAllCarBrands(): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getAllCarBrands`);
  }
}
