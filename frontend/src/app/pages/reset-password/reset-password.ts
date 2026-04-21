import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { readApiError } from '../../core/error.util';
import { PasswordApiService } from '../forgot-password/password-api.service';

@Component({
    selector: 'app-reset-password-page',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './reset-password.html',
    styleUrl: './reset-password.css',
})
export class ResetPasswordPage {
    private readonly route = inject(ActivatedRoute);
    private readonly api = inject(PasswordApiService);

    readonly busy = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly token = computed(() => this.route.snapshot.queryParamMap.get('token') ?? '');

    new_password = '';

    submit() {
        if (!this.token()) {
            this.error.set('Missing token. Please use the link from your email.');
            return;
        }

        this.busy.set(true);
        this.error.set('');
        this.success.set('');

        this.api.confirmReset(this.token(), this.new_password).subscribe({
            next: (resp) => {
                this.success.set(resp.detail || 'Password reset successful.');
                this.new_password = '';
            },
            error: (err) => this.error.set(readApiError(err)),
            complete: () => this.busy.set(false),
        });
    }
}
