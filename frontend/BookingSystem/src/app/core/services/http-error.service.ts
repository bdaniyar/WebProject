import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpErrorService {
    toMessage(err: any, fallback = 'Request failed. Please try again.'): string {
        return err?.error?.detail || err?.error?.message || err?.message || fallback;
    }
}
