import { Component, OnInit } from '@angular/core'; // Agrega OnInit
import { ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormBuilder,
  FormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from '../../../services/aler.service';
import { AuthService } from '../../../auth/auth.service';
import { InventarioService } from '../../../services/inventario.service';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-add-respuesto',
  templateUrl: './add-respuesto.component.html',
  styleUrls: ['./add-respuesto.component.css'] // Corregí styleUrl a styleUrls
})

export class AddRespuestoComponent implements OnInit { // Implementa OnInit

  imagenBase64: string | null = null; // Para la previsualización

  respuestosForm: FormGroup;
  id: string | null = null;
  title: string = '';
  nameButtom: string = 'Nuevo';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService,
    private inventarioService: InventarioService,
    private route: ActivatedRoute,
    private http: HttpClient // Aunque inyectado, no lo usaremos directamente para guardar el repuesto completo
  ) {
    this.respuestosForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      cantidad_disponible: ['', [Validators.required, Validators.min(0)]],
      cantidad_minima: ['', [Validators.required, Validators.min(0)]],
      costo_unitario: ['', [Validators.required, Validators.min(0)]],
      fecha_ingreso: ['', [Validators.required]],
      // Aquí el cambio clave: la imagen ahora será controlada por el formulario
      imagen: ['', Validators.required], // Este campo almacenará la cadena Base64
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    if (this.id) {
      this.title = 'Actualizar';
      this.nameButtom = 'Actualizar';
      this.inventarioService.ListOneRespuesto(Number(this.id)).subscribe({
        next: (data) => {
         
          if (data.data.imagen) {
            this.imagenBase64 = data.data.imagen; // Si la DB devuelve Base64
          }
          this.respuestosForm.patchValue(data.data);
        },
        error: (errorData) => {
          console.error(errorData);
          this.alertService.errorUpload();
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.imagenBase64 = reader.result as string; // Esto es para la previsualización
        // ¡ESTA LÍNEA ES CLAVE! Asigna la Base64 al control del formulario
        this.respuestosForm.get('imagen')?.setValue(this.imagenBase64);
        // O si quieres asegurarte de que el validador se actualice:
        this.respuestosForm.get('imagen')?.updateValueAndValidity();
      };

      reader.readAsDataURL(archivo); // Convierte la imagen a base64
    }
  }

  // La función 'guardar()' que tenías antes ya no es necesaria
  // La lógica de guardado y actualización se manejará en create() y update()
  // que ya interactúan con inventarioService.

  create() {
  

    // Asegúrate de que el formulario es válido antes de enviar
    if (this.respuestosForm.invalid) {
      this.alertService.error("Por favor, completa todos los campos requeridos.");
      return;
    }

    if (this.nameButtom === "Nuevo") {
      this.inventarioService.insertarRepuesto(this.respuestosForm.value).subscribe({
        next: (data) => {
         
          this.alertService.create(); // Cambié a this.alertService.create() para ejecutar la función
          this.router.navigate(['/repuestos']).then(() => {
            window.location.reload();
          });
        },
        error: (errorData) => {
          console.error('Error al crear repuesto', errorData);
          this.alertService.errorCreate(); // Cambié a this.alertService.errorCreate()
        },
      });
    } else {
      // Esta rama no debería ejecutarse si nameButtom es "Nuevo",
      // la lógica de actualización está en la función 'update()'
      // que se llama por separado, pero la mantengo por si acaso.
      this.update();
    }
  }

  update() {
   

    // Asegúrate de que el formulario es válido antes de enviar
    if (this.respuestosForm.invalid) {
      this.alertService.error("Por favor, completa todos los campos requeridos.");
      return;
    }

    if (this.id) {
      this.inventarioService.updateRepuesto(Number(this.id), this.respuestosForm.value).subscribe({
        next: (data) => {
       
          this.alertService.create(); // Cambié a this.alertService.create()
          this.router.navigate(['/repuestos']).then(() => {
            window.location.reload();
          });
        },
        error: (errorData) => {
          console.error('Error al actualizar repuesto', errorData);
          this.alertService.errorCreate(); // Cambié a this.alertService.errorCreate()
        },
      });
    } else {
      console.error("ID de repuesto no disponible para actualizar.");
      this.alertService.error("No se pudo actualizar el repuesto: ID no encontrado.");
    }
  }
}
