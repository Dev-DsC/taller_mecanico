import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Cita {
  cita_id: number;
  usuario_id: number | null;
  servicio_id: number;
  fecha: string;
  hora: string;
  estado: string;
  observaciones: string;
  creado_en: string;
}

interface CitasResponse {
  ok: boolean;
  data: Cita[];
}

export interface CitaResponse {
  ok: boolean;
  data: Cita;
}


@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = `${environment.backendUrl}/api/users/cita`;

  private citasSubject = new BehaviorSubject<Cita[]>([]);
  citas$ = this.citasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Ahora devuelve Observable para poder suscribirse externamente
  cargarCitas(): Observable<CitasResponse> {
    return this.http.get<CitasResponse>(this.apiUrl).pipe(
      tap(resp => {
        if (resp.ok) {
          this.citasSubject.next(resp.data);
        }
      })
    );
  }

  getCitas(): Observable<CitasResponse> {
    return this.http.get<CitasResponse>(this.apiUrl);
  }

  getCitaPorId(id: number): Observable<CitaResponse> {
    return this.http.get<CitaResponse>(`${this.apiUrl}/${id}`);
  }

  crearCita(cita: any): Observable<CitaResponse> {
    return this.http.post<CitaResponse>(this.apiUrl, cita);
  }

  crearCitaYActualizar(cita: any): Observable<CitaResponse> {
    return new Observable<CitaResponse>(observer => {
      this.crearCita(cita).subscribe({
        next: (resp) => {
          if (resp.ok) {
            const actuales = this.citasSubject.value;
            this.citasSubject.next([...actuales, resp.data]);
          }
          observer.next(resp);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  actualizarCita(id: number, cita: any): Observable<any> {
    return new Observable<any>(observer => {
      this.http.put<any>(`${this.apiUrl}/${id}`, cita).subscribe({
        next: (resp) => {
          const actuales = this.citasSubject.value;
          const index = actuales.findIndex(c => c.cita_id === id);
          if (index !== -1) {
            actuales[index] = { ...actuales[index], ...cita };
            this.citasSubject.next([...actuales]);
          }
          observer.next(resp);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  eliminarCita(id: number): Observable<any> {
    return new Observable<any>(observer => {
      this.http.delete<any>(`${this.apiUrl}/eliminar/${id}`).subscribe({
        next: (resp) => {
          const actuales = this.citasSubject.value;
          const nuevas = actuales.filter(c => c.cita_id !== id);
          this.citasSubject.next(nuevas);

          observer.next(resp);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }
}
