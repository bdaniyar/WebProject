import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);

  loading = true;
  error: string | null = null;

  name = '';
  email = '';
  accountMessage: string | null = null;
  securityMessage: string | null = null;
  securityError: string | null = null;
  accountSubmitted = false;
  securitySubmitted = false;
  savingAccount = false;
  changingPassword = false;

  currentPassword = '';
  newPassword = '';

  ngOnInit() {
    this.loadProfile();
  }

  get initials(): string {
    const raw = this.name.trim() || this.email.trim();
    if (!raw) return 'U';
    const parts = raw.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  get emailInvalid(): boolean {
    return this.accountSubmitted && !this.email.includes('@');
  }

  get nameInvalid(): boolean {
    return this.accountSubmitted && this.name.trim().length < 2;
  }

  get newPasswordInvalid(): boolean {
    return this.securitySubmitted && this.newPassword.trim().length < 6;
  }

  get currentPasswordInvalid(): boolean {
    return this.securitySubmitted && !this.currentPassword.trim();
  }

  loadProfile() {
    this.loading = true;
    this.error = null;
    this.auth.getCurrentUser().subscribe((result) => {
      this.loading = false;
      if (!result.ok) {
        this.error = result.error;
        return;
      }
      this.name = result.data.first_name ?? 'Guest User';
      this.email = result.data.email;
    });
  }

  saveProfile() {
    this.accountSubmitted = true;
    this.accountMessage = null;
    this.error = null;

    if (this.nameInvalid || this.emailInvalid) return;

    this.savingAccount = true;
    this.auth.updateProfile(this.name, this.email).subscribe((result) => {
      this.savingAccount = false;
      if (!result.ok) {
        this.error = result.error;
        return;
      }
      this.name = result.data.first_name ?? this.name;
      this.email = result.data.email;
      this.accountMessage = 'Profile updated successfully.';
    });
  }

  savePassword() {
    this.securitySubmitted = true;
    this.securityMessage = null;
    this.securityError = null;

    if (this.currentPasswordInvalid || this.newPasswordInvalid) return;

    this.changingPassword = true;
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe((result) => {
      this.changingPassword = false;
      if (!result.ok) {
        this.securityError = result.error;
        return;
      }
      this.securityMessage = 'Password changed successfully.';
      this.currentPassword = '';
      this.newPassword = '';
      this.securitySubmitted = false;
    });
  }
}
