import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions } from '@fullcalendar/core';
import { CitaService } from '../../../services/cita.service';
import { MatDialog } from '@angular/material/dialog';
import { DetalleCitaDialogComponent } from '../citas-calendario/detalle-cita-dialog/detalle-cita-dialog.component';

@Component({
  selector: 'app-citas-calendario',
  templateUrl: './citas-calendario.component.html',
  styleUrls: ['./citas-calendario.component.css']
})
export class CitasCalendarioComponent implements OnInit {

  calendarOptions?: CalendarOptions;

  constructor(
    private citaService: CitaService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.citaService.getCitas().subscribe(response => {
        const citasArray = response.data;

        this.calendarOptions = {
          plugins: [dayGridPlugin, interactionPlugin],
          initialView: 'dayGridMonth',
          displayEventTime: false,
          events: citasArray.map(cita => ({
            title: 'Cita Agendada',
            date: cita.fecha,
            id: cita.cita_id.toString(),
            allDay: true
          })),
          eventClick: this.mostrarDetalleCita.bind(this)
        };
      });
    }
  }

mostrarDetalleCita(info: any) {
  const citaId = Number(info.event.id);
  this.citaService.getCitaPorId(citaId).subscribe(response => {
    const cita = response.data;

    const dialogRef = this.dialog.open(DetalleCitaDialogComponent, {
      data: cita,
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si hubo cambios o eliminaciones, recarga las citas.
        this.ngOnInit();
      }
    });
  });
}




}
