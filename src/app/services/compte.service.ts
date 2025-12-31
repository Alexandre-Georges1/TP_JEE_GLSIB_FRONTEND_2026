import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map, combineLatest } from 'rxjs';
import { Compte, CompteFormData, TypeCompte } from '../models/compte.model';
import { ClientService } from './client.service';

@Injectable({
  providedIn: 'root'
})
export class CompteService {
  private comptes$ = new BehaviorSubject<Compte[]>([]);
  private storageKey = 'egabank_comptes';
  private platformId = inject(PLATFORM_ID);

  constructor(private clientService: ClientService) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      const comptes = JSON.parse(stored).map((c: any) => ({
        ...c,
        dateCreation: new Date(c.dateCreation)
      }));
      this.comptes$.next(comptes);
    }
  }

  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.comptes$.value));
  }

  private generateNumeroCompte(type: TypeCompte): string {
    const prefix = type === 'EPARGNE' ? 'EP' : 'CC';
    const numero = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${numero}-${random}`;
  }

  getComptes(): Observable<Compte[]> {
    return combineLatest([this.comptes$, this.clientService.getClients()]).pipe(
      map(([comptes, clients]) => {
        return comptes.map(compte => {
          const client = clients.find(c => c.id === compte.clientId);
          return {
            ...compte,
            clientNom: client?.nom,
            clientPrenom: client?.prenom
          };
        });
      })
    );
  }

  getComptesByClient(clientId: string): Observable<Compte[]> {
    return this.comptes$.pipe(
      map(comptes => comptes.filter(c => c.clientId === clientId))
    );
  }

  getCompteByNumero(numero: string): Observable<Compte | undefined> {
    return combineLatest([this.comptes$, this.clientService.getClients()]).pipe(
      map(([comptes, clients]) => {
        const compte = comptes.find(c => c.numeroCompte === numero);
        if (compte) {
          const client = clients.find(c => c.id === compte.clientId);
          return {
            ...compte,
            clientNom: client?.nom,
            clientPrenom: client?.prenom
          };
        }
        return undefined;
      })
    );
  }

  createCompte(data: CompteFormData): Compte {
    const newCompte: Compte = {
      numeroCompte: this.generateNumeroCompte(data.typeCompte),
      typeCompte: data.typeCompte,
      dateCreation: new Date(),
      solde: data.soldeInitial,
      clientId: data.clientId
    };

    const current = this.comptes$.value;
    this.comptes$.next([...current, newCompte]);
    this.saveToStorage();
    return newCompte;
  }

  updateSolde(numeroCompte: string, nouveauSolde: number): boolean {
    const current = this.comptes$.value;
    const index = current.findIndex(c => c.numeroCompte === numeroCompte);
    
    if (index === -1) return false;

    current[index] = { ...current[index], solde: nouveauSolde };
    this.comptes$.next([...current]);
    this.saveToStorage();
    return true;
  }

  deleteCompte(numeroCompte: string): boolean {
    const current = this.comptes$.value;
    const filtered = current.filter(c => c.numeroCompte !== numeroCompte);
    
    if (filtered.length === current.length) return false;

    this.comptes$.next(filtered);
    this.saveToStorage();
    return true;
  }

  deleteComptesByClient(clientId: string): void {
    const current = this.comptes$.value;
    const filtered = current.filter(c => c.clientId !== clientId);
    this.comptes$.next(filtered);
    this.saveToStorage();
  }

  getTotalSolde(): Observable<number> {
    return this.comptes$.pipe(
      map(comptes => comptes.reduce((sum, c) => sum + c.solde, 0))
    );
  }

  getComptesCount(): Observable<{ epargne: number; courant: number; total: number }> {
    return this.comptes$.pipe(
      map(comptes => ({
        epargne: comptes.filter(c => c.typeCompte === 'EPARGNE').length,
        courant: comptes.filter(c => c.typeCompte === 'COURANT').length,
        total: comptes.length
      }))
    );
  }
}
