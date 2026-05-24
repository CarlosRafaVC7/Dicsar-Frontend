import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  blockedMinutes = 0;
  isBlocked = false;
  returnUrl = '/dashboard';
  showPassword = false;
  rememberMe = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Inicializar siempre el formulario (antes de chequear login)
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.loginForm.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });

    // Si ya está logueado, redirigir al dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Obtener la URL de retorno
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isBlocked) {
      if (this.isBlocked) {
        this.errorMessage = `Usuario bloqueado. Intenta de nuevo en ${this.blockedMinutes} minutos`;
      } else {
        Object.keys(this.loginForm.controls).forEach(key => {
          this.loginForm.get(key)?.markAsTouched();
        });
        this.errorMessage = 'Necesitas rellenar los datos para poder ingresar';
      }
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.loading = false;
        
        if (error.status === 423) {
          const msg = error.error?.message || 'Usuario bloqueado';
          this.errorMessage = msg;
          const match = msg.match(/(\d+)\s*minutos?/);
          if (match) {
            this.blockedMinutes = parseInt(match[1]);
            this.isBlocked = true;
            this.startBlockCountdown();
          }
        } else if (error.status === 401) {
          const backendMessage = error.error?.message;
          if (backendMessage) {
            this.errorMessage = backendMessage;
          } else {
            this.errorMessage = 'Usuario o contraseña incorrecta';
          }
        } else if (error.status === 404) {
          this.errorMessage = 'Usuario no encontrado';
        } else if (error.status === 0 || error.status === 500) {
          this.errorMessage = 'Error al conectar con el servidor';
        } else {
          this.errorMessage = error.error?.message || 'Error al conectar con el servidor';
        }
      }
    });
  }

  private startBlockCountdown(): void {
    const interval = setInterval(() => {
      if (this.blockedMinutes > 0) {
        this.blockedMinutes--;
      } else {
        this.isBlocked = false;
        this.errorMessage = '';
        clearInterval(interval);
      }
    }, 60000);
  }

  get f() {
    return this.loginForm.controls;
  }
}
