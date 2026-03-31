import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cambiarcontrasena',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cambiarcontrasena.component.html',
  styleUrls: ['./cambiarcontrasena.component.css']
})
export class CambiarcontrasenaComponent {
  passwordActual = '';
  passwordNueva = '';
  passwordConfirmar = '';

  cerrarModal() {
    // Aquí puedes ocultar el modal si lo controlas con una variable
    alert('Modal cerrado (implementa lógica real)');
  }

  cambiarContrasena() {
    if (!this.passwordActual || !this.passwordNueva || !this.passwordConfirmar) {
      alert('Completa todos los campos');
      return;
    }
    if (this.passwordNueva !== this.passwordConfirmar) {
      alert('Las contraseñas nuevas no coinciden');
      return;
    }
    // Aquí iría la lógica real para cambiar la contraseña
    alert('Contraseña cambiada correctamente (implementa lógica real)');
  }
}
