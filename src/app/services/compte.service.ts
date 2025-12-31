import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, combineLatest, tap, catchError, of } from 'rxjs';
import { Compte, CompteFormData, TypeCompte } from '../models/compte.model';
import { ClientService } from './client.service';

@Injectable({
  providedIn: 'root'
})
export class CompteService {
  private comptes$ = new BehaviorSubject<Compte[]>([]);
  private storageKey = 'egabank_comptes';
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/comptes';

  constructor(private clientService: ClientService) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadComptes();
    }
  }

  private loadComptes(): void {
    this.http.get<Compte[]>(this.apiUrl).pipe(
      catchError(() => {
        this.loadFromStorage();
        return of([]);
      })
    ).subscribe(comptes => {
      if (comptes.length > 0) {
        this.comptes$.next(comptes);
      }
    });
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      const comptes = JSON.parse(stored);
      this.comptes$.next(comptes);
    }
  }

  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.comptes$.value));
  }

  private generateNumeroCompte(type: string): string {
    const prefix = type === 'EPARGNE' ? 'EP' : 'CC';
    const numero = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${numero}-${random}`;
  }

  getComptes(): Observable<Compte[]> {
    return combineLatest([this.comptes$, this.clientService.getClients()]).pipe(
      map(([comptes, clients]) => {
        return comptes.map(compte => {
          const client = compte.client ? clients.find(c => c.id === compte.client!.id) : null;
          return {
            ...compte,
            clientNom: client?.nom || compte.client?.nom,
            clientPrenom: client?.prenom || compte.client?.prenom
          };
        });
      })
    );
  }

  getComptesByClient(clientId: string): Observable<Compte[]> {
    return this.comptes$.pipe(
      map(comptes => comptes.filter(c => c.client?.id === parseInt(clientId, 10)))
    );
  }

  getCompteByNumero(numero: string): Observable<Compte | undefined> {
    return combineLatest([this.comptes$, this.clientService.getClients()]).pipe(
      map(([comptes, clients]) => {
        const compte = comptes.find(c => c.numeroCompte === numero);
        if (compte) {
          const client = compte.client ? clients.find(c => c.id === compte.client!.id) : null;
          return {
            ...compte,
            clientNom: client?.nom || compte.client?.nom,
            clientPrenom: client?.prenom || compte.client?.prenom
          };
        }
        return undefined;
      })
    );
  }

  createCompte(data: CompteFormData): Observable<Compte> {
    const compteData = {
      numeroCompte: this.generateNumeroCompte(data.typeCompte),
      dateCreation: new Date(),
      typeCompte: data.typeCompte,
      solde: data.solde,
      client: data.client
    };

    return this.http.post<Compte>(this.apiUrl, compteData).pipe(
      tap(compte => {
        const current = this.comptes$.value;
        this.comptes$.next([...current, compte]);
        this.saveToStorage();
      }),
      catchError(error => {
        console.error('Erreur lors de la création du compte:', error);
        throw error;
      })
    );
  }

  updateSolde(numeroCompte: string, nouveauSolde: number): Observable<boolean> {
    const current = this.comptes$.value;
    const compte = current.find(c => c.numeroCompte === numeroCompte);
    
    if (!compte || !compte.id) return of(false);

    const updatedCompte = { ...compte, solde: nouveauSolde };
    
    return this.http.put<Compte>(`${this.apiUrl}/${compte.id}`, updatedCompte).pipe(
      tap(updated => {
        const index = current.findIndex(c => c.numeroCompte === numeroCompte);
        if (index !== -1) {
          current[index] = updated;
          this.comptes$.next([...current]);
          this.saveToStorage();
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Erreur lors de la mise à jour du solde:', error);
        // Fallback local
        const index = current.findIndex(c => c.numeroCompte === numeroCompte);
        if (index !== -1) {
          current[index] = { ...current[index], solde: nouveauSolde };
          this.comptes$.next([...current]);
          this.saveToStorage();
          return of(true);
        }
        return of(false);
      })
    );
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
    const comptesToDelete = current.filter(c => c.client?.id === parseInt(clientId, 10));
    
    comptesToDelete.forEach(compte => {
      if (compte.id) {
        this.http.delete(`${this.apiUrl}/${compte.id}`).subscribe({
          error: (error) => console.error('Erreur lors de la suppression:', error)
        });
      }
    });
    
    const filtered = current.filter(c => c.client?.id !== parseInt(clientId, 10));
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
