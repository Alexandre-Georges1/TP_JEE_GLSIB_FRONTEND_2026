import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    // Vérifier les rôles si spécifiés
    const requiredRole = route.data['role'] as string;
    
    if (requiredRole === 'ADMIN' && !this.authService.isAdmin) {
      this.router.navigate(['/client']);
      return false;
    }

    if (requiredRole === 'CLIENT' && !this.authService.isClient) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
