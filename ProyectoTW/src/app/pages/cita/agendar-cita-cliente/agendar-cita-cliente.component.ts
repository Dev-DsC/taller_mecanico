import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { servicios } from '../../../models/servicio.model';
import { ServicioDetalleService } from '../../../services/servicio-detalle.service';
import { CitaService } from '../../../services/cita.service';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';

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
  private authService: AuthService,
  private toastr: ToastrService
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

  guardarCita() {
  if (this.citaForm.invalid) {
    this.toastr.warning('Por favor, complete todos los campos requeridos.', 'Campos incompletos');
    return;
  }

  this.cargando = true;
  const token = this.authService.getTokenCookie();
  if (!token) {
    this.toastr.error('Debe iniciar sesión para agendar una cita.', 'No autenticado');
    this.cargando = false;
    return;
  }

  let cliente_id: number | null = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    cliente_id = payload.userId;
  } catch (error) {
    this.toastr.error('Error de autenticación. Inicie sesión nuevamente.', 'Token inválido');
    this.cargando = false;
    return;
  }

  if (!cliente_id) {
    this.toastr.error('No se pudo obtener el ID del usuario.', 'ID no encontrado');
    this.cargando = false;
    return;
  }

  const fechaObj: Date = this.citaForm.value.fecha;
  const fechaSeleccionada = new Date(fechaObj);
  fechaSeleccionada.setHours(0, 0, 0, 0);
  const fechaStr = fechaSeleccionada.toISOString().split('T')[0];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaSeleccionada < hoy) {
    this.toastr.error('No se puede agendar una cita en una fecha pasada.', 'Fecha inválida');
    this.cargando = false;
    return;
  }

  const cita = {
    ...this.citaForm.value,
    fecha: fechaStr,
    usuario_id: cliente_id,
    estado: 'PENDIENTE'
  };

  this.CitaService.crearCitaYActualizar(cita).subscribe({
    next: () => {
      this.toastr.success('Cita agendada exitosamente.', 'Éxito');
      this.cargando = false;
      this.citaForm.reset();
      this.CitaService.cargarCitas().subscribe(); // actualiza citas$
    },
    error: (error) => {
      if (error.code === '23505') {
        this.toastr.warning('Ya existe una cita agendada para esa fecha y hora.', 'Cita duplicada');
      } else {
        this.toastr.error('Error al agendar la cita.', 'Error');
      }
      this.cargando = false;
    }
  });
}

}
