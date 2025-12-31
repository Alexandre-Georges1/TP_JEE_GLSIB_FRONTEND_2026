import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginType = signal<'CLIENT' | 'ADMIN'>('CLIENT');
  numeroCompte = signal('');
  password = signal('');
  codeAdmin = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Rediriger si déjà connecté
    if (this.authService.isLoggedIn) {
      this.redirectAfterLogin();
    }
  }

  setLoginType(type: 'CLIENT' | 'ADMIN'): void {
    this.loginType.set(type);
    this.errorMessage.set('');
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.isLoading.set(true);

    const credentials: LoginCredentials = {
      type: this.loginType(),
      numeroCompte: this.numeroCompte(),
      password: this.password(),
      codeAdmin: this.codeAdmin()
    };

    try {
      const result = await this.authService.login(credentials);
      
      if (result.success) {
        this.redirectAfterLogin();
      } else {
        this.errorMessage.set(result.message);
      }
    } catch (error) {
      this.errorMessage.set('Erreur de connexion');
    } finally {
      this.isLoading.set(false);
    }
  }

  private redirectAfterLogin(): void {
    if (this.authService.isAdmin) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/client']);
    }
  }
}
