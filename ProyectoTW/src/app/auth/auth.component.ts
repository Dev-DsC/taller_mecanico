import { Component } from '@angular/core';
import { FormBuilder, FormGroup,  Validators
} from '@angular/forms';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { AlertService } from '../services/aler.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
 loginForm: FormGroup;
 showPassword: boolean = false;
errorMessage: string = ''; // <--- propiedad para mostrar error en pantalla

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password_hash: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

   login() {
    this.errorMessage = ''; // limpiar mensaje previo
    this.authService.signIn(this.loginForm.value).subscribe({
      next: (data) => {
        this.alertService.login(); // mensaje éxito (toast u otro)
        this.router.navigate(['/servicio']).then(() => {
          window.location.reload();
        });
      },
      error: (errorData) => {
        console.error(errorData);

        const backendMsg = errorData.error?.msg;

        switch(backendMsg) {
          case 'Email not found':
            this.errorMessage = 'Correo no encontrado';
            break;
          case 'Debe verificar su correo primero':
            this.errorMessage = 'Debe verificar su correo antes de ingresar';
            break;
          case 'Invalid credentials':
            this.errorMessage = 'Credenciales inválidas';
            break;
          default:
            this.errorMessage = 'Error desconocido. Intenta de nuevo.';
            break;
        }
      }
    });
    this.loginForm.reset();
  }
}

