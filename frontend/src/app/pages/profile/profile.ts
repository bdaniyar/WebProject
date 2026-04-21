import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { readApiError } from '../../core/error.util';
import { UserProfile } from '../../core/models';
import { UserApiService } from './user-api.service';

@Component({
    selector: 'app-profile-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css',
})
export class ProfilePage {
    private readonly auth = inject(AuthService);
    private readonly api = inject(UserApiService);
    private readonly router = inject(Router);
    private readonly platformId = inject(PLATFORM_ID);

    readonly busy = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly user = this.auth.user;
    readonly isAuthenticated = this.auth.isAuthenticated;

    profileForm = {
        username: '',
        first_name: '',
        last_name: '',
        email: '',
    };

    passwordForm = {
        old_password: '',
        new_password: '',
    };

    readonly displayName = computed(() => {
        const u = this.user();
        if (!u) return '';
        const full = `${u.first_name} ${u.last_name}`.trim();
        return full || u.username;
    });

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        if (!this.auth.isAuthenticated()) {
            void this.router.navigate(['/login']);
            return;
        }

        this.loadProfile();
    }

    loadProfile() {
        this.busy.set(true);
        this.error.set('');
        this.success.set('');

        this.api.getMe().subscribe({
            next: (me) => {
                this.auth.updateUser(me);
                this.profileForm = {
                    username: me.username,
                    first_name: me.first_name,
                    last_name: me.last_name,
                    email: me.email,
                };
            },
            error: (error) => this.error.set(readApiError(error)),
            complete: () => this.busy.set(false),
        });
    }

    saveProfile() {
        this.busy.set(true);
        this.error.set('');
        this.success.set('');

        this.api.updateMe(this.profileForm).subscribe({
            next: (me) => {
                this.auth.updateUser(me);
                this.success.set('Profile updated.');
            },
            error: (error) => this.error.set(readApiError(error)),
            complete: () => this.busy.set(false),
        });
    }

    changePassword() {
        this.busy.set(true);
        this.error.set('');
        this.success.set('');

        this.api.changePassword(this.passwordForm).subscribe({
            next: () => {
                this.success.set('Password updated.');
                this.passwordForm = { old_password: '', new_password: '' };
            },
            error: (error) => this.error.set(readApiError(error)),
            complete: () => this.busy.set(false),
        });
    }
}
