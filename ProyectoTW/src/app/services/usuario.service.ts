// usuario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';


export interface Usuario {
  usuario_id: number;
  nombre: string;
  email: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
    private apiUrl = `${environment.backendUrl}/api/users`;

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios (ya devuelve directamente Array<Usuario>)
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
  }


  // Insertar un nuevo usuario
  insertarUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, usuario);
  }

  // Obtener un usuario por ID
  ListOneUsuario(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/filtrar/${id}`);
  }

  // Actualizar usuario por ID
  updateUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/editar/${id}`, usuario);
  }

  // Eliminar usuario por ID
  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/eliminar/${id}`);
  }
}
