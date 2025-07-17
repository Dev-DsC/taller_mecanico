import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { servicios } from '../../../models/servicio.model';
import { ServicioDetalleService } from '../../../services/servicio-detalle.service';
import { CitaService } from '../../../services/cita.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-agendar-cita-cliente',
  templateUrl: './agendar-cita-cliente.component.html',
  styleUrls: ['./agendar-cita-cliente.component.css']
})
export class AgendarCitaClienteComponent implements OnInit {
  citaForm!: FormGroup;
  servicios: servicios[] = [];
  mensaje: string = '';
  cargando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private ServicioDetalleService: ServicioDetalleService,
    private CitaService: CitaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarServicios();
  }

  initForm() {
    this.citaForm = this.fb.group({
      servicio_id: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      observaciones: ['']
    });
  }

  cargarServicios() {
    this.ServicioDetalleService.getServicioAll().subscribe(data => {
      this.servicios = data;
    });
  }

  formatearFecha(fecha: Date | string): string {
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`; // Ej: '2025-07-10'
  }

guardarCita() {
  
  if (this.citaForm.valid) {
   
    this.cargando = true;

    const token = this.authService.getTokenCookie();
   

    if (!token) {
      this.mensaje = 'Debe iniciar sesión para agendar una cita.';
      this.cargando = false;
      console.error('Token no encontrado. El usuario debe iniciar sesión.');
      return;
    }

    let cliente_id: number | null = null;

   try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  
  cliente_id = payload.userId;  // Corrección aquí
} catch (error) {
  console.error('Error al decodificar token:', error);
  this.mensaje = 'Error de autenticación. Por favor inicia sesión nuevamente.';
  this.cargando = false;
  return;
}


    if (!cliente_id) {
      this.mensaje = 'No se pudo obtener el ID del usuario desde el token.';
      this.cargando = false;
      console.error('ID del cliente no encontrado en el token.');
      return;
    }

   const cita = {
  ...this.citaForm.value,
  fecha: this.formatearFecha(this.citaForm.value.fecha),
  usuario_id: cliente_id,
  estado: 'PENDIENTE'
};


   

    this.CitaService.crearCita(cita).subscribe(
      () => {
      
        this.mensaje = 'Cita agendada exitosamente';
        this.cargando = false;
        this.citaForm.reset();
      },
      (error) => {
        console.error('Error al crear cita:', error);
        if (error.code === '23505') {
          this.mensaje = 'Ya existe una cita agendada para esa fecha y hora.';
        } else {
          this.mensaje = 'Error al agendar la cita';
        }
        this.cargando = false;
      }
    );
  } else {
    console.warn('Formulario inválido:', this.citaForm.errors);
    this.mensaje = 'Por favor, complete todos los campos requeridos.';
  }
}


}
