import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServicioDetalleService } from '../../../services/servicio-detalle.service';
import { servicios } from '../../../models/servicio.model';
import { CitaService, CitaResponse } from '../../../services/cita.service';
import { UsuarioService } from '../../../services/usuario.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-agendar-cita',
  templateUrl: './agendar-cita.component.html',
  styleUrls: ['./agendar-cita.component.css']
})
export class AgendarCitaComponent implements OnInit {
  citaForm!: FormGroup;
  clientes: any[] = [];
  servicios: servicios[] = [];
  cargando = false;
  hoyString = '';
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private servicioDetalleService: ServicioDetalleService,
    private citaService: CitaService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.hoyString = this.formatearFecha(new Date());
    this.initForm();
    this.cargarClientes();
    this.cargarServicios();
  }

  initForm() {
    this.citaForm = this.fb.group({
      usuario_id: ['', Validators.required],
      servicio_id: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      estado: ['PENDIENTE'],
      observaciones: ['']
    });
  }

  cargarClientes() {
    this.usuarioService.getUsuarios().subscribe({
      next: data => {
        this.clientes = data.filter(u => u.rol === 'cliente');
      },
      error: err => {
        console.error('Error cargando usuarios:', err);
        this.toastr.error('No se pudieron cargar los clientes.', 'Error');
      }
    });
  }

  cargarServicios() {
    this.servicioDetalleService.getServicioAll().subscribe({
      next: data => {
        this.servicios = data;
      },
      error: err => {
        console.error('Error cargando servicios:', err);
        this.toastr.error('No se pudieron cargar los servicios.', 'Error');
      }
    });
  }

  formatearFecha(fecha: Date | string): string {
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  guardarCita() {
    if (this.citaForm.invalid) {
      this.toastr.error('Por favor completa todos los campos obligatorios.', 'Formulario inválido');
      return;
    }

    const fechaSeleccionada = new Date(this.citaForm.value.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      this.toastr.warning('No puedes agendar citas en fechas pasadas.', 'Fecha inválida');
      return;
    }

    this.cargando = true;

    const cita = { ...this.citaForm.value };
    cita.fecha = this.formatearFecha(cita.fecha);

    this.citaService.crearCitaYActualizar(cita).subscribe({
      next: (resp: CitaResponse) => {
        this.toastr.success('Cita agendada exitosamente.', 'Éxito');
        this.citaService.cargarCitas().subscribe(); // actualizar listado
        this.citaForm.reset();
        this.cargando = false;
      },
      error: (error) => {
        console.error(error);
        this.mensajeError = error.error?.mensaje || 'Error al agendar la cita.';
        this.toastr.error(this.mensajeError, 'Error');
        this.cargando = false;
      }
    });
  }
}
