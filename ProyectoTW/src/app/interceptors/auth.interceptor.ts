import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

// Pone el token de sesión en cada petición al API: el backend exige sesión en todo salvo el
// login y el catálogo público (docs/plan/fases/fase-01-sistema-interno.md).
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getTokenCookie();
    if (!token || !req.url.startsWith(environment.backendUrl)) {
      return next.handle(req);
    }

    const conToken = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next.handle(conToken).pipe(
      catchError((error: unknown) => {
        // La sesión caducó o el administrador retiró la cuenta: se cierra y se vuelve al login
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.authService.deleteTokenCookie();
          this.router.navigate(['/register']);
        }
        return throwError(() => error);
      })
    );
  }
}
