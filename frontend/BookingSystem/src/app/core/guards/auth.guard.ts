import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authGuard: CanActivateFn = () => {
    const tokenService = inject(TokenService);
    if (tokenService.isLoggedIn()) return true;
    return inject(Router).createUrlTree(['/login']);
};
