import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of, tap, switchMap, forkJoin } from 'rxjs';
import { Transaction, TransactionFormData, TypeTransaction, DeposerRetirerRequest, TransfererRequest } from '../models/transaction.model';
import { CompteService } from './compte.service';
import { Compte } from '../models/compte.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transactions$ = new BehaviorSubject<Transaction[]>([]);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/comptes';

  constructor(private compteService: CompteService) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTransactions();
    }
  }

  private loadTransactions(): void {
    // Charger les transactions via les comptes (les transactions sont liées aux comptes)
    this.compteService.getComptes().subscribe(comptes => {
      const allTransactions: Transaction[] = [];
      comptes.forEach(compte => {
        if (compte.transactions && compte.transactions.length > 0) {
          compte.transactions.forEach(txn => {
            allTransactions.push({
              ...txn,
              numeroCompte: compte.numeroCompte
            });
          });
        }
      });
      this.transactions$.next(allTransactions);
    });
  }

  refreshTransactions(): void {
    this.loadTransactions();
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(txns => [...txns].sort((a, b) => 
        new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime()
      ))
    );
  }

  getTransactionsByCompte(numeroCompte: string): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(txns => txns
        .filter(t => t.numeroCompte === numeroCompte)
        .sort((a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())
      )
    );
  }

  getTransactionsByPeriod(dateDebut: Date, dateFin: Date): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(txns => txns
        .filter(t => {
          const txnDate = new Date(t.dateTransaction);
          return txnDate >= dateDebut && txnDate <= dateFin;
        })
        .sort((a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())
      )
    );
  }

  // Méthode pour effectuer un dépôt
  deposer(compteId: number, montant: number): Observable<{ success: boolean; message: string }> {
    const body: DeposerRetirerRequest = { montant };
    return this.http.post(`${this.apiUrl}/${compteId}/deposer`, body).pipe(
      tap(() => this.refreshTransactions()),
      map(() => ({ success: true, message: 'Dépôt effectué avec succès' })),
      catchError(error => {
        console.error('Erreur lors du dépôt:', error);
        return of({ success: false, message: error.error?.message || 'Erreur lors du dépôt' });
      })
    );
  }

  // Méthode pour effectuer un retrait
  retirer(compteId: number, montant: number): Observable<{ success: boolean; message: string }> {
    const body: DeposerRetirerRequest = { montant };
    return this.http.post(`${this.apiUrl}/${compteId}/retirer`, body).pipe(
      tap(() => this.refreshTransactions()),
      map(() => ({ success: true, message: 'Retrait effectué avec succès' })),
      catchError(error => {
        console.error('Erreur lors du retrait:', error);
        return of({ success: false, message: error.error?.message || 'Solde insuffisant ou erreur lors du retrait' });
      })
    );
  }

  // Méthode pour effectuer un virement
  transferer(compteSourceId: number, compteDestId: number, montant: number): Observable<{ success: boolean; message: string }> {
    const body: TransfererRequest = { montant, id: compteDestId };
    return this.http.post(`${this.apiUrl}/${compteSourceId}/transferer`, body).pipe(
      tap(() => this.refreshTransactions()),
      map(() => ({ success: true, message: 'Virement effectué avec succès' })),
      catchError(error => {
        console.error('Erreur lors du virement:', error);
        return of({ success: false, message: error.error?.message || 'Erreur lors du virement' });
      })
    );
  }

  // Méthode unifiée pour effectuer une transaction
  effectuerTransaction(data: TransactionFormData): Observable<{ success: boolean; message: string }> {
    switch (data.type) {
      case 'DEPOT':
        return this.deposer(data.compteId, data.montant);
      case 'RETRAIT':
        return this.retirer(data.compteId, data.montant);
      case 'VIREMENT':
        if (!data.compteDestinationId) {
          return of({ success: false, message: 'Compte destination requis pour un virement' });
        }
        return this.transferer(data.compteId, data.compteDestinationId, data.montant);
      default:
        return of({ success: false, message: 'Type de transaction invalide' });
    }
  }

  getRecentTransactions(limit: number = 10): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(txns => [...txns]
        .sort((a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())
        .slice(0, limit)
      )
    );
  }

  deleteTransactionsByCompte(numeroCompte: string): void {
    const current = this.transactions$.value;
    const filtered = current.filter(t => t.numeroCompte !== numeroCompte);
    this.transactions$.next(filtered);
  }
}
