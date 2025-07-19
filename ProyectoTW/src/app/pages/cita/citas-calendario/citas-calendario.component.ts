import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions } from '@fullcalendar/core';
import { CitaService, Cita } from '../../../services/cita.service';
import { MatDialog } from '@angular/material/dialog';
import { DetalleCitaDialogComponent } from '../citas-calendario/detalle-cita-dialog/detalle-cita-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-citas-calendario',
  templateUrl: './citas-calendario.component.html',
  styleUrls: ['./citas-calendario.component.css']
})
export class CitasCalendarioComponent implements OnInit, OnDestroy {

  calendarOptions?: CalendarOptions;
  private citasSub?: Subscription;

  constructor(
    private citaService: CitaService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.citaService.cargarCitas().subscribe();

      this.citasSub = this.citaService.citas$.subscribe((citas: Cita[]) => {
        this.updateCalendarOptions(citas);
      });
    }
  }

  private updateCalendarOptions(citas: Cita[]) {
    const events = citas.map(cita => ({
      title: 'Cita Agendada',
      date: cita.fecha,
      id: cita.cita_id.toString(),
      allDay: true
    }));

    this.calendarOptions = {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      displayEventTime: false,
      events,
      eventClick: this.mostrarDetalleCita.bind(this)
    };
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
          // Si eliminó o actualizó, recarga la lista para reflejar cambios
          this.citaService.cargarCitas().subscribe();
        }
      });
    });
  }

  ngOnDestroy() {
    this.citasSub?.unsubscribe();
  }
}
