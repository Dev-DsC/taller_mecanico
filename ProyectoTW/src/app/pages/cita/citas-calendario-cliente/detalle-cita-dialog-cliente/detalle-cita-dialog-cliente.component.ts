import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-detalle-cita-dialog-cliente',
  templateUrl: './detalle-cita-dialog-cliente.component.html',
  styleUrl: './detalle-cita-dialog-cliente.component.css'
})
export class DetalleCitaDialogClienteComponent implements OnInit {

  fecha: string = '';
  hora: string = '';

  constructor(
    private dialogRef: MatDialogRef<DetalleCitaDialogClienteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.fecha = this.data.fecha?.split('T')[0] || '';
    this.hora = this.data.hora || '';
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
