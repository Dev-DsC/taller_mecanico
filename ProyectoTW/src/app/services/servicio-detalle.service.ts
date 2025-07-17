import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';



@Injectable({
  providedIn: 'root'
})

export class ServicioDetalleService {
    private apiUrl = `${environment.backendUrl}/api/users`;

  constructor(private http: HttpClient) {}
getFacturaById(id: number) {
  return this.http.get<any>(`http://localhost:3000/api/users/factura/${id}`);
}

  getServicioDetalle(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/servicio-detalles`).pipe(
      map((response) => response.data) // Extrae el arreglo "data" de la respuesta
    );
  }

  insertarServicioDetalle(servicioDetalle: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/servicio-detalle`, servicioDetalle);
  }

  getServicioAll(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/servicios`).pipe(
      map((response) => response.data) // Extrae el arreglo "data" de la respuesta
    );
  }
 getServicioById(id: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/servicio/${id}`);
}


}
