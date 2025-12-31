import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { User, LoginCredentials } from '../models/auth.model';
import { CompteService } from './compte.service';
import { ClientService } from './client.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private platformId = inject(PLATFORM_ID);

  // Code admin prédéfini
  private readonly ADMIN_CODE = 'EGABANK2024';
  
  // Mot de passe par défaut pour les clients (en production, ce serait dans une base de données)
  private readonly DEFAULT_CLIENT_PASSWORD = '1234';

  constructor(
    private router: Router,
    private compteService: CompteService,
    private clientService: ClientService
  ) {
    // Restaurer la session si elle existe
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('egabank_user');
      if (savedUser) {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  get isAdmin(): boolean {
    return this.currentUserSubject.value?.type === 'ADMIN';
  }

  get isClient(): boolean {
    return this.currentUserSubject.value?.type === 'CLIENT';
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string }> {
    if (credentials.type === 'ADMIN') {
      return this.loginAdmin(credentials.codeAdmin || '');
    } else {
      return await this.loginClient(credentials.numeroCompte || '');
    }
  }

  private loginAdmin(code: string): { success: boolean; message: string } {
    if (code === this.ADMIN_CODE) {
      const user: User = {
        id: 'admin',
        type: 'ADMIN',
        nom: 'Administrateur',
        prenom: 'EgaBank'
      };
      this.setUser(user);
      return { success: true, message: 'Connexion réussie' };
    }
    return { success: false, message: 'Code administrateur incorrect' };
  }

  private async loginClient(numeroCompte: string): Promise<{ success: boolean; message: string }> {
    // Vérifier si le compte existe
    const compte = await firstValueFrom(this.compteService.getCompteByNumero(numeroCompte));
    
    if (!compte) {
      return { success: false, message: 'Numéro de compte invalide' };
    }

    // Récupérer les infos du client
    const client = await firstValueFrom(this.clientService.getClientById(compte.clientId));

    const user: User = {
      id: compte.clientId,
      type: 'CLIENT',
      numeroCompte: compte.numeroCompte,
      clientId: compte.clientId,
      nom: client?.nom || compte.clientNom,
      prenom: client?.prenom || compte.clientPrenom
    };

    this.setUser(user);
    return { success: true, message: 'Connexion réussie' };
  }

  private setUser(user: User): void {
    this.currentUserSubject.next(user);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('egabank_user', JSON.stringify(user));
    }
  }

  logout(): void {
    this.currentUserSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('egabank_user');
    }
    this.router.navigate(['/login']);
  }
}
