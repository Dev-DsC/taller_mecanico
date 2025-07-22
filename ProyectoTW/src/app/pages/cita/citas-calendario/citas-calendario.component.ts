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

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    displayEventTime: false,
    events: [],
    eventClick: this.mostrarDetalleCita.bind(this),
  };

  private citasSub?: Subscription;

  constructor(
    private citaService: CitaService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Cargar inicialmente las citas y actualizar el BehaviorSubject
      this.citaService.cargarCitas().subscribe();

      // Suscribirse para actualizar el calendario cuando las citas cambien
      this.citasSub = this.citaService.citas$.subscribe((citas: Cita[]) => {
        this.actualizarEventosCalendario(citas);
      });
    }
  }

  actualizarEventosCalendario(citas: Cita[]) {
    // Mapear citas a eventos compatibles con fullcalendar
    const events = citas.map(cita => ({
      title: 'Cita Agendada',
      date: cita.fecha,
      id: cita.cita_id.toString(),
      allDay: true
    }));

    // Actualizar solo la propiedad events para que fullcalendar refresque sin recrear toda la config
    this.calendarOptions = {
      ...this.calendarOptions,
      events,
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
          // Recargar las citas para reflejar cambios tras editar/eliminar
          this.citaService.cargarCitas().subscribe();
        }
      });
    });
  }

  ngOnDestroy() {
    this.citasSub?.unsubscribe();
  }
}
