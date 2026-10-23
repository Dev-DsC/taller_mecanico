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
        // Solo entra el personal: después del login, al panel
        this.router.navigate(['/cita/agendar']).then(() => {
          window.location.reload();
        });
      },
      error: (errorData) => {
        console.error(errorData);

        const backendMsg = errorData.error?.msg;

        switch(backendMsg) {
          case 'Invalid credentials':
            this.errorMessage = 'Correo o contraseña incorrectos';
            break;
          case 'Acceso solo para el personal del taller':
            this.errorMessage = 'Este acceso es solo para el personal del taller. Para pedir una cita, escríbenos por WhatsApp.';
            break;
          case 'Cuenta no activada':
            this.errorMessage = 'Tu cuenta no está activada. Pide al administrador que la revise.';
            break;
          default:
            // 429: el backend ya explica que hay que esperar
            this.errorMessage = errorData.status === 429 && backendMsg
              ? backendMsg
              : 'Error desconocido. Intenta de nuevo.';
            break;
        }
      }
    });
    this.loginForm.reset();
  }
}

