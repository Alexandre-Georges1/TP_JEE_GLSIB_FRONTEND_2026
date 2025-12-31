import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CompteService } from '../../services/compte.service';
import { TransactionService } from '../../services/transaction.service';
import { Compte } from '../../models/compte.model';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css'
})
export class ClientDashboardComponent implements OnInit {
  compte = signal<Compte | null>(null);
  transactions = signal<Transaction[]>([]);
  allClientComptes = signal<Compte[]>([]);

  userName = computed(() => {
    const user = this.authService.currentUser;
    return user ? `${user.prenom} ${user.nom}` : '';
  });

  constructor(
    public authService: AuthService,
    private compteService: CompteService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadClientData();
  }

  private loadClientData(): void {
    const user = this.authService.currentUser;
    if (user && user.numeroCompte) {
      // Charger le compte du client
      this.compteService.getCompteByNumero(user.numeroCompte).subscribe(compte => {
        this.compte.set(compte || null);

        // Charger les transactions
        if (compte) {
          this.transactionService.getTransactions().subscribe(allTransactions => {
            const clientTransactions = allTransactions.filter((t: Transaction) => 
              t.numeroCompte === compte.numeroCompte || 
              t.compteDestination === compte.numeroCompte
            );
            // Trier par date décroissante et prendre les 10 dernières
            this.transactions.set(
              clientTransactions
                .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
            );
          });
        }
      });

      // Charger tous les comptes du client
      if (user.clientId) {
        this.compteService.getComptesByClient(user.clientId).subscribe(comptes => {
          this.allClientComptes.set(comptes);
        });
      }
    }
  }

  getTransactionSign(transaction: Transaction): string {
    if (transaction.type === 'DEPOT') return '+';
    if (transaction.type === 'RETRAIT') return '-';
    if (transaction.type === 'VIREMENT') {
      return transaction.numeroCompte === this.compte()?.numeroCompte ? '-' : '+';
    }
    return '';
  }

  getTransactionClass(transaction: Transaction): string {
    if (transaction.type === 'DEPOT') return 'credit';
    if (transaction.type === 'RETRAIT') return 'debit';
    if (transaction.type === 'VIREMENT') {
      return transaction.numeroCompte === this.compte()?.numeroCompte ? 'debit' : 'credit';
    }
    return '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(montant);
  }

  logout(): void {
    this.authService.logout();
  }
}
