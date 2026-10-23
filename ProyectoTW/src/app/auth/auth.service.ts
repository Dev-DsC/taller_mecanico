import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Login } from '../models/login.model';
import { LoginResponse } from '../interface/loginResponse';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
 
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = `${environment.backendUrl}/api/users`;

  private userRoleSubject = new BehaviorSubject<string>('');
  userRole$ = this.userRoleSubject.asObservable();
  
  constructor(
    private httpClient: HttpClient,
    private cokkieService: CookieService
  ) {this.setUserRoleFromToken();}

  // No hay registro público: las cuentas son del personal y las crea el admin en /usuario/add

  signIn(login: Login): Observable<LoginResponse> {
    return this.httpClient
      .post<LoginResponse>(`${this.API_URL}/login`, login)
      .pipe(
        tap((data: LoginResponse) => {
          this.setTokenCookie(data.token);
          this.setUserRoleFromToken();
        })
      );
  }

 setUserRoleFromToken() {
  const token = this.getTokenCookie();
  if (!token) {
    this.userRoleSubject.next('');
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.userRoleSubject.next(payload.rol || '');
  } catch (error) {
    console.error('Error decoding token:', error);
    this.userRoleSubject.next('');
  }
}



  // Dura lo mismo que el JWT (1 h). Secure solo en https, para que localhost siga funcionando.
  setTokenCookie(token: string) {
    const enHttps = typeof location !== 'undefined' && location.protocol === 'https:';
    this.cokkieService.set('token', token, {
      expires: 1 / 24,
      path: '/',
      sameSite: 'Strict',
      secure: enHttps,
    });
  }

  getTokenCookie() {
    return this.cokkieService.get('token');
  }

  deleteTokenCookie(){
    this.cokkieService.delete('token', '/');
    this.cokkieService.deleteAll(); // las cookies de antes se guardaban sin path
    this.clearUserRole();
  }
 clearUserRole() {
    this.userRoleSubject.next('');
  }
  getUserRole(): string {
    const token = this.getTokenCookie();
    if (!token) return '';
  
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decodifica el token
     
      return payload.rol || ''; // 🔥 CAMBIA "role" POR "rol"
    } catch (error) {
      console.error('Error decoding token:', error);
      return '';
    }
  }
}