import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/driver'; //todo-P3 : use env files

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  getDriverIdFromToken(): string {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/']);
      return '';
    } else {
      const payload = jwtDecode(token);
      return (payload as any).driverId;
    }
  }
  public login(body: any): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/login`, body);
  }
  public signUp(body: any): Observable<any> {
    return this.http.post<{ response: any }>(`${this.apiUrl}/signUp`, body);
  }
}