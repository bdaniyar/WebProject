import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { readApiError } from '../../core/error.util';
import { LoginPayload, RegisterPayload } from '../../core/models';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  credentials: LoginPayload = {
    username: 'demo',
    password: 'demo1234',
  };

  registerForm: RegisterPayload = {
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
  };

  submitLogin() {
    this.busy.set(true);
    this.error.set('');
    this.success.set('');

    this.auth.login(this.credentials).subscribe({
      next: () => {
        this.success.set('Login successful. Redirecting to bookings...');
        void this.router.navigate(['/bookings']);
      },
      error: (error) => this.error.set(readApiError(error)),
      complete: () => this.busy.set(false),
    });
  }

  submitRegister() {
    this.busy.set(true);
    this.error.set('');
    this.success.set('');

    this.auth.register(this.registerForm).subscribe({
      next: () => {
        this.success.set('Account created. You are now signed in.');
        void this.router.navigate(['/bookings']);
      },
      error: (error) => this.error.set(readApiError(error)),
      complete: () => this.busy.set(false),
    });
  }

  fillDemo() {
    this.credentials = { username: 'demo', password: 'demo1234' };
  }
}
