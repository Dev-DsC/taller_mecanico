import { NgModule } from '@angular/core';
import { RouterModule, RouterOutlet, Routes } from '@angular/router';

// Importa los componentes de las páginas
import { ServiciosComponent } from './pages/servicios/servicios.component';
import { RepuestosComponent } from './pages/repuestos/repuestos.component';
import { UbicacionComponent } from './pages/ubicacion/ubicacion.component';
import { AcercaDeComponent } from './pages/acerca-de/acerca-de.component';
import { ContactanosComponent } from './pages/contactanos/contactanos.component';
import { AuthComponent } from './auth/auth.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { ClienteComponent } from './pages/cliente/cliente.component';
import { ServicioContratadoComponent } from './pages/servicio-contratado/servicio-contratado.component';
import { UsuarioComponent } from './pages/usuario/usuario.component';
import { AgendarCitaClienteComponent } from './pages/cita/agendar-cita-cliente/agendar-cita-cliente.component';
import { AgendarCitaComponent } from './pages/cita/agendar-cita/agendar-cita.component';
import { AuthGuard } from './guards/auth.guard';
import { AddClienteComponent } from './pages/cliente/add-cliente/add-cliente.component';
import { AddUsuarioComponent } from './pages/usuario/add-usuario/add-usuario.component';
import { VerificacionExitosaComponent } from './pages/verificacion-exitosa/verificacion-exitosa.component';
import { AddRespuestoComponent } from './pages/inventario/add-respuestos/add-respuesto.component';

const routes: Routes = [
  { path: 'servicios', component: ServiciosComponent, data: { animation: 'ServiciosPage', index: 1 } },
  { path: 'repuestos', component: RepuestosComponent, data: { animation: 'RepuestosPage', index: 2 } },
  { path: 'ubicacion', component: UbicacionComponent, data: { animation: 'UbicacionPage', index: 3 } },
  { path: 'acerca-de', component: AcercaDeComponent, data: { animation: 'AcercaDePage', index: 4 } },
  { path: 'contactanos', component: ContactanosComponent, data: { animation: 'ContactanosPage', index: 5 } },
  { path: 'register', component: AuthComponent, data: { animation: 'RegisterPage', index: 6 } },
  { path: 'agendar-cita-cliente', component: AgendarCitaClienteComponent, data: { animation: 'AgendarCitaClientePage', index: 6 } },
  { path: 'verificado', component: VerificacionExitosaComponent },
  // Aquí proteges rutas que requieran autenticación y roles específicos
  { 
    path: 'inventario', 
    component: InventarioComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['admin'], animation: 'InventarioPage', index: 7 } 
  },
   {
  path: 'inventario/add',
  component: AddRespuestoComponent,
  canActivate: [AuthGuard],
  data: { roles: ['admin','tecnico'], animation: 'addIventarioPAge', index: 8 }
},
  {
  path: 'inventario/add/:id',
  component: AddRespuestoComponent,
  canActivate: [AuthGuard],
  data: { roles: ['admin','tecnico'], animation: 'editInventarioPage', index: 8 }
},

  { 
    path: 'cliente', 
    component: ClienteComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['admin', 'tecnico'], animation: 'ClientePage', index: 9 } 
  },
   {
  path: 'cliente/edit/:id',
  component: AddClienteComponent,
  canActivate: [AuthGuard],
  data: { roles: ['admin', 'tecnico'], animation: 'editClientePage', index: 10 }
  },
  {
    path: 'servicio-contratado',
    component: ServicioContratadoComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'tecnico'], animation: 'ServicioContratadoPage', index: 11 }
  },
  {
    path: 'usuario',
    component: UsuarioComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'], animation: 'UsuarioPage', index: 13 }
  },
   {
    path: 'usuario/add',
    component: AddUsuarioComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'], animation: 'editUsuarioPage', index: 13 }
  },
  {
    path: 'usuario/edit/:id',
    component: AddUsuarioComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'], animation: 'editUsuarioPage', index: 13 }
  },
  {
    path: 'cita/agendar',
    component: AgendarCitaComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'tecnico'], animation: 'AgendarCitaPage', index: 16 }
  },
  

  { path: '', redirectTo: '/servicios', pathMatch: 'full' },
  { path: '**', redirectTo: '/servicios', pathMatch: 'full' },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  getRouteAnimationData(outlet: RouterOutlet) {
    if (!outlet || !outlet.activatedRouteData) {
      return null;
    }
    return outlet.activatedRouteData['index'];
  }
}