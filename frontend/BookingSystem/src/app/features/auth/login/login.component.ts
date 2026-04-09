import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    email = '';
    password = '';
    loading = false;
    error: string | null = null;
    submitted = false;

    get emailInvalid(): boolean {
        return this.submitted && !this.email.includes('@');
    }

    get passwordInvalid(): boolean {
        return this.submitted && this.password.trim().length < 6;
    }

    login() {
        this.submitted = true;
        this.error = null;

        if (this.emailInvalid || this.passwordInvalid) {
            return;
        }

        this.loading = true;

        this.auth.login(this.email, this.password).subscribe((result) => {
            this.loading = false;

            if (!result.ok) {
                this.error = result.error;
                return;
            }

            // after login → redirect to hotels
            void this.router.navigate(['/hotels']);
        });
    }
}
