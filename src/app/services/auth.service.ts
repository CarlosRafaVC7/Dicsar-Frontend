import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, AuthResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/auth`;
  private currentUserSubject: BehaviorSubject<AuthResponse | null>;
  public currentUser: Observable<AuthResponse | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<AuthResponse | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          // Soportar tanto 'jwt' como 'token'
          const token = response.jwt || response.token || '';
          console.log('🔐 Login Response:', response);
          console.log('🔑 Token extraído:', token);

          localStorage.setItem('currentUser', JSON.stringify(response));
          localStorage.setItem('token', token);

          console.log('💾 Token guardado en localStorage:', localStorage.getItem('token'));
          this.currentUserSubject.next(response);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: 'ADMIN' | 'VENDEDOR'): boolean {
    const user = this.currentUserValue;
    return user ? user.rol === role : false;
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    if (!user) return false;

    // Verificar por rol ADMIN o si el nombre contiene 'admin'
    if (typeof user.rol === 'string' && user.rol === 'ADMIN') {
      return true;
    }

    if (user.nombreCompleto && user.nombreCompleto.toLowerCase().includes('admin')) {
      return true;
    }

    return false;
  }

  isVendedor(): boolean {
    return this.hasRole('VENDEDOR');
  }
}
