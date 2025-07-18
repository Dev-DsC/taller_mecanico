import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


interface Cita {
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

interface CitaResponse {
  ok: boolean;
  data: Cita;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {
 private apiUrl = `${environment.backendUrl}/api/users/cita`;


  constructor(private http: HttpClient) {}

  getCitas(): Observable<CitasResponse> {
    return this.http.get<CitasResponse>(this.apiUrl);
  }

  getCitaPorId(id: number): Observable<CitaResponse> {
    return this.http.get<CitaResponse>(`${this.apiUrl}/${id}`);
  }

  crearCita(cita: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cita);
  }

  actualizarCita(id: number, cita: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, cita);
  }

  eliminarCita(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/eliminar/${id}`);
  }
}
