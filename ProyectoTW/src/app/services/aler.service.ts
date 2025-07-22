import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  error(arg0: string) {
    throw new Error('Method not implemented.');
  }
  constructor() {}

  register() {
    Swal.fire({
      position: 'center',
      icon: 'success',
      title: 'Registro Exitoso!',
      showConfirmButton: false,
      timer: 1500,
    });
  }
  login() {
    Swal.fire({
      position: 'center',
      icon: 'success',
      title: 'Inicio de sesión Exitoso!',
      showConfirmButton: false,
      timer: 1500,
    });
  }

  errorlogin() {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'No se ha podido registrar.'
      
    });
  }

  
  errorCredenciales() {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Los datos son invalidos.'
      
    });
  }

  
  errorCreate() {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'No se puede registrar.'
      
    });
  }

  errorCreateService() {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'No se ha podido registrar el servicio'
      
    });
  }

  errorUpload() {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'No se ha podido cargar los datos'
      
    });
  }
  errorUpdate() {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'No se pudo actualziar los datos del usuario.'
      
    });
  }
  create() {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
    Toast.fire({
      icon: 'success',
      title: 'Successfully',
    });
  }

  update() {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
    Toast.fire({
      icon: 'success',
      title: 'Update',
    });
  }

  delete() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede revertir!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, deseo eliminar!',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminado!',
          text: 'El registro fue eliminado.',
          icon: 'success',
        });
      }
    });
  }
}
