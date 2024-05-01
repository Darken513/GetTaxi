import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/admin'; //todo-P2 : use env files

  constructor(
    private http: HttpClient
  ) { }

  public getAllCarTypes(): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getAllCarTypes`);
  }
  public createCarType(def: any): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/createCarType`, def);
  }
  public deleteCarTypeById(id: any): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/deleteCarTypeById/${id}`);
  }

  public getAllCarBrands(): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getAllCarBrands`);
  }
  public createCarBrand(def: any): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/createCarBrand`, def);
  }
  public deleteCarBrandById(id: any): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/deleteCarBrandById/${id}`);
  }

  public getAllDrivers(): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getAllDrivers`);
  }
  public createDriver(def: any): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/createDriver`, def);
  }
  public deleteDriverById(id: string): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/deleteDriverById/${id}`);
  }
  public changeDriverStatus(id: string, status: boolean): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/changeDriverStatus/${id}/${status}`);
  }
  public updateDriver(def: any, id: string): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/updateDriver/${id}`, def);
  }

  public getAllZones(): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/getAllZones`);
  }
  public createZone(def: any): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/createZone`, def);
  }
  public deleteZoneById(id: any): Observable<any> {
    return this.http.get<{ response: any }>(`${this.apiUrl}/deleteZoneById/${id}`);
  }

  public initRideStatus(details: any): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/initRideStatus`, details);
  }

  public uploadDriversFiles(formData: FormData, fileKey:any, driverId:any): Observable<any> {
    return this.http.post(`${this.apiUrl}/uploadFile/${driverId}/${fileKey}`, formData); 
  }
  public readDriverFilesURLS(filePath:any, driverId:any): Observable<any> {
    return this.http.get(`${this.apiUrl}/readFileURL/${driverId}/${filePath}`);
  }
}
