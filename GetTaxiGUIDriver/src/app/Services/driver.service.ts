import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DriverService {

  private apiUrl = 'http://localhost:8080/driver'; //todo-P3 : use env files

  public env = {
    RIDE_CANCELED_CLIENT:'RideCanceled_Client',
    RIDE_CANCELED_DRIVER:'RideCanceled_Driver',
    RIDE_ACCEPTED:'RideAccepted',
    RIDE_ENDED:'RideEnded'
  }

  constructor(
    private http: HttpClient
  ) { }

  public getDriverById(driverId: string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getDriverById/${driverId}`);
  }
  public getDriverBehaviorsById(driverId: string, nbr:number): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getDriverBehaviorsById/${driverId}/${nbr}`);
  }
  public changeRideStatus(driverId: string, rideId: string, rideStatus:number): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/changeRideStatus/${driverId}/${rideId}/${rideStatus}`);
  }
  public sendSMSVerificationCode(): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/sendSMSVerificationCode`);
  }
  public verifySMSCode(code: string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/verifySMSCode/${code}`);
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
  public acceptRide(rideId: string, driverId: string, latitude:string, longitude:string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/acceptRide/${rideId}/${driverId}/${latitude}/${longitude}`);
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
