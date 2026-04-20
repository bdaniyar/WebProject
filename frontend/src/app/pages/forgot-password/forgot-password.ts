import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { readApiError } from '../../core/error.util';
import { PasswordApiService } from './password-api.service';

@Component({
    selector: 'app-forgot-password-page',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './forgot-password.html',
    styleUrl: './forgot-password.css',
})
export class ForgotPasswordPage {
    private readonly api = inject(PasswordApiService);

    readonly busy = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    email = '';

    submit() {
        this.busy.set(true);
        this.error.set('');
        this.success.set('');

        this.api.requestReset(this.email).subscribe({
            next: (resp) => {
                this.success.set(resp.detail || 'If the email exists, a reset link was sent.');
                this.email = '';
            },
            error: (err) => this.error.set(readApiError(err)),
            complete: () => this.busy.set(false),
        });
    }
}
