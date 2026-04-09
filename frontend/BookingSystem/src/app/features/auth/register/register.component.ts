import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';
  loading = false;
  error: string | null = null;
  submitted = false;

  get nameInvalid(): boolean {
    return this.submitted && this.name.trim().length < 2;
  }

  get emailInvalid(): boolean {
    return this.submitted && !this.email.includes('@');
  }

  get passwordInvalid(): boolean {
    return this.submitted && this.password.trim().length < 6;
  }

  register() {
    this.submitted = true;
    this.error = null;

    if (this.nameInvalid || this.emailInvalid || this.passwordInvalid) {
      return;
    }

    this.loading = true;
    this.auth.register(this.name, this.email, this.password).subscribe((result) => {
      this.loading = false;

      if (!result.ok) {
        this.error = result.error;
        return;
      }

      void this.router.navigate(['/hotels']);
    });
  }
}
