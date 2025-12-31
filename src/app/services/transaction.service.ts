import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Transaction, TransactionFormData, TypeTransaction } from '../models/transaction.model';
import { CompteService } from './compte.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transactions$ = new BehaviorSubject<Transaction[]>([]);
  private storageKey = 'egabank_transactions';
  private platformId = inject(PLATFORM_ID);

  constructor(private compteService: CompteService) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      const transactions = JSON.parse(stored).map((t: any) => ({
        ...t,
        date: new Date(t.date)
      }));
      this.transactions$.next(transactions);
    }
  }

  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.transactions$.value));
  }

  private generateId(): string {
    return 'TXN-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(txns => [...txns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    );
  }

  getTransactionsByCompte(numeroCompte: string): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(txns => txns
        .filter(t => t.numeroCompte === numeroCompte || t.compteDestination === numeroCompte)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      )
    );
  }

  getTransactionsByPeriod(dateDebut: Date, dateFin: Date): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(txns => txns
        .filter(t => {
          const txnDate = new Date(t.date);
          return txnDate >= dateDebut && txnDate <= dateFin;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      )
    );
  }

  async effectuerTransaction(data: TransactionFormData): Promise<{ success: boolean; message: string; transaction?: Transaction }> {
    return new Promise((resolve) => {
      this.compteService.getCompteByNumero(data.numeroCompte).subscribe(compte => {
        if (!compte) {
          resolve({ success: false, message: 'Compte non trouvé' });
          return;
        }

        let nouveauSolde = compte.solde;
        let description = data.description || '';

        switch (data.type) {
          case 'DEPOT':
            nouveauSolde += data.montant;
            description = description || `Dépôt de ${data.montant.toFixed(2)} €`;
            break;

          case 'RETRAIT':
            if (compte.solde < data.montant) {
              resolve({ success: false, message: 'Solde insuffisant' });
              return;
            }
            nouveauSolde -= data.montant;
            description = description || `Retrait de ${data.montant.toFixed(2)} €`;
            break;

          case 'VIREMENT':
            if (!data.compteDestination) {
              resolve({ success: false, message: 'Compte destination requis' });
              return;
            }
            if (compte.solde < data.montant) {
              resolve({ success: false, message: 'Solde insuffisant' });
              return;
            }
            
            this.compteService.getCompteByNumero(data.compteDestination).subscribe(compteDest => {
              if (!compteDest) {
                resolve({ success: false, message: 'Compte destination non trouvé' });
                return;
              }

              // Débiter le compte source
              this.compteService.updateSolde(data.numeroCompte, compte.solde - data.montant);
              // Créditer le compte destination
              this.compteService.updateSolde(data.compteDestination!, compteDest.solde + data.montant);

              const transaction: Transaction = {
                id: this.generateId(),
                numeroCompte: data.numeroCompte,
                type: 'VIREMENT',
                montant: data.montant,
                date: new Date(),
                description: description || `Virement vers ${data.compteDestination}`,
                soldeApres: compte.solde - data.montant,
                compteDestination: data.compteDestination
              };

              const current = this.transactions$.value;
              this.transactions$.next([...current, transaction]);
              this.saveToStorage();

              resolve({ success: true, message: 'Virement effectué avec succès', transaction });
            });
            return;
        }

        this.compteService.updateSolde(data.numeroCompte, nouveauSolde);

        const transaction: Transaction = {
          id: this.generateId(),
          numeroCompte: data.numeroCompte,
          type: data.type,
          montant: data.montant,
          date: new Date(),
          description,
          soldeApres: nouveauSolde
        };

        const current = this.transactions$.value;
        this.transactions$.next([...current, transaction]);
        this.saveToStorage();

        resolve({ success: true, message: 'Transaction effectuée avec succès', transaction });
      });
    });
  }

  getRecentTransactions(limit: number = 10): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(txns => [...txns]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
      )
    );
  }

  deleteTransactionsByCompte(numeroCompte: string): void {
    const current = this.transactions$.value;
    const filtered = current.filter(t => t.numeroCompte !== numeroCompte && t.compteDestination !== numeroCompte);
    this.transactions$.next(filtered);
    this.saveToStorage();
  }
}
