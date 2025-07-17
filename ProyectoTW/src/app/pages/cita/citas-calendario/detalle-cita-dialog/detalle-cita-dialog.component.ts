import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CitaService } from '../../../../services/cita.service';

@Component({
  selector: 'app-detalle-cita-dialog',
  templateUrl: './detalle-cita-dialog.component.html',
  styleUrls: ['./detalle-cita-dialog.component.css']
})
export class DetalleCitaDialogComponent implements OnInit {
  citaForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DetalleCitaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private citaService: CitaService
  ) {}

  ngOnInit(): void {
    const fechaFormateada = this.data.fecha?.split('T')[0]; // '2025-07-10'

   this.citaForm = this.fb.group({
  usuario_id: [this.data.usuario_id || '', Validators.required], // cambia cliente_id por usuario_id
  servicio_id: [this.data.servicio_id || '', Validators.required],
  fecha: [fechaFormateada || '', Validators.required],
  hora: [this.data.hora || '', Validators.required],
  estado: [this.data.estado || 'PENDIENTE'],
  observaciones: [this.data.observaciones || '']
});

  }

actualizarCita() {
  console.log('Clic en actualizar');

  if (this.citaForm.valid) {
    console.log('Formulario válido:', this.citaForm.value);
    const citaData = { ...this.citaForm.value };

    citaData.fecha = citaData.fecha?.toString().split('T')[0];
    if (citaData.hora && citaData.hora.length === 5) {
      citaData.hora = citaData.hora + ':00';
    }

    this.citaService.actualizarCita(this.data.cita_id, citaData).subscribe({
      next: () => {
        console.log('Cita actualizada correctamente');
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al actualizar cita:', error);
      }
    });
  } else {
    console.warn('Formulario inválido:', this.citaForm.value);
  }
}




  eliminarCita() {
    this.citaService.eliminarCita(this.data.cita_id).subscribe(() => {
      this.dialogRef.close(true);
    });
  }
}
