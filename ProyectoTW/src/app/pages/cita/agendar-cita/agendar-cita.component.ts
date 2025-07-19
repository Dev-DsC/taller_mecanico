import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClienteService } from '../../../services/cliente.service';
import { ServicioDetalleService } from '../../../services/servicio-detalle.service';
import { clientes } from '../../../models/cliente.model';
import { servicios } from '../../../models/servicio.model';
import { CitaService } from '../../../services/cita.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-agendar-cita',
  templateUrl: './agendar-cita.component.html',
  styleUrls: ['./agendar-cita.component.css']
})
export class AgendarCitaComponent implements OnInit {
  citaForm!: FormGroup;
  clientes: clientes[] = [];
  servicios: servicios[] = [];
  mensaje: string = '';
  cargando: boolean = false;

 constructor(
  private fb: FormBuilder,
  private clienteService: ClienteService,
  private ServicioDetalleService: ServicioDetalleService,
  private citaService: CitaService,
  private snackBar: MatSnackBar
) {}


 hoyString: string = '';

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
    this.clienteService.getCliente().subscribe(data => {
      this.clientes = data;
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
    return `${year}-${month}-${day}`;
  }

 guardarCita() {
  if (this.citaForm.invalid) {
    this.snackBar.open('Por favor, complete todos los campos requeridos.', 'Cerrar', {
      duration: 3000,
      panelClass: 'snackbar-error'
    });
    return;
  }

  const fechaSeleccionada = new Date(this.citaForm.value.fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaSeleccionada < hoy) {
    this.snackBar.open('No puedes agendar citas en fechas pasadas.', 'Cerrar', {
      duration: 3000,
      panelClass: 'snackbar-error'
    });
    return;
  }

  this.cargando = true;

  const cita = { ...this.citaForm.value };
  cita.fecha = this.formatearFecha(cita.fecha);

  this.citaService.crearCitaYActualizar(cita).subscribe({
    next: () => {
      this.snackBar.open('Cita agendada exitosamente.', 'Cerrar', {
        duration: 3000,
        panelClass: 'snackbar-ok'
      });
      this.citaForm.reset();
      this.cargando = false;
    },
    error: (error) => {
      console.error(error);
      this.snackBar.open('Error al agendar la cita.', 'Cerrar', {
        duration: 3000,
        panelClass: 'snackbar-error'
      });
      this.cargando = false;
    }
  });
}


}
