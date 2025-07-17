import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';




export interface Inventario {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
}
@Injectable({
  providedIn: 'root'
})

export class ClienteService {
  private apiUrl = `${environment.backendUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getCliente(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/clientes`).pipe(
      map((response) => response.data) // Extrae el arreglo "data" de la respuesta
    );
  }

  insertarCliente(repuesto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cliente`, repuesto);
  }

  ListOneCliente(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cliente/filtrar/${id}`);
  }

  updateCliente(id: number,cliente:any): Observable<any> {
    return this.http.put(`${this.apiUrl}/cliente/${id}`,cliente);
  }

  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cliente/${id}`);
  }
}
