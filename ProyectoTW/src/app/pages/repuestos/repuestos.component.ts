import { Component, OnInit  } from '@angular/core';
import { InventarioService } from '../../services/inventario.service';

@Component({
  selector: 'app-repuestos',
  templateUrl: './repuestos.component.html',
  styleUrl: './repuestos.component.css'
})
export class RepuestosComponent  implements OnInit{
  inventarios: any[] = []; // Asegúrate de que sea un arreglo

  constructor(private inventarioService: InventarioService) {}

  ngOnInit(): void {
    this.obtenerInventarios();
  }

  obtenerInventarios(): void {
    this.inventarioService.getCatalogo().subscribe(
      (data) => {
        this.inventarios = data; // data ya es un arreglo (response.data)
      },
      (error) => {
        console.error('Error al obtener los inventarios:', error);
      }
    );
  }
}
