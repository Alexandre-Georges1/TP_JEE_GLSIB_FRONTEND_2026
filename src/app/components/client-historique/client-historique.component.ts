import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CompteService } from '../../services/compte.service';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-client-historique',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './client-historique.component.html',
  styleUrl: './client-historique.component.css'
})
export class ClientHistoriqueComponent implements OnInit {
  transactions = signal<Transaction[]>([]);
  filteredTransactions = signal<Transaction[]>([]);
  
  numeroCompte = signal<string>('');
  dateDebut = signal<string>('');
  dateFin = signal<string>('');
  filterType = signal<string>('');

  constructor(
    public authService: AuthService,
    private compteService: CompteService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user?.numeroCompte) {
      this.numeroCompte.set(user.numeroCompte);
      this.loadTransactions();
    }
  }

  private loadTransactions(): void {
    this.transactionService.getTransactions().subscribe(allTransactions => {
      const myTransactions = allTransactions.filter((t: Transaction) => 
        t.numeroCompte === this.numeroCompte() || 
        t.compteDestination === this.numeroCompte()
      );
      // Trier par date décroissante
      this.transactions.set(
        myTransactions.sort((a: Transaction, b: Transaction) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let result = [...this.transactions()];

    // Filtre par type
    if (this.filterType()) {
      result = result.filter(t => t.type === this.filterType());
    }

    // Filtre par date début
    if (this.dateDebut()) {
      const debut = new Date(this.dateDebut());
      result = result.filter(t => new Date(t.date) >= debut);
    }

    // Filtre par date fin
    if (this.dateFin()) {
      const fin = new Date(this.dateFin());
      fin.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.date) <= fin);
    }

    this.filteredTransactions.set(result);
  }

  resetFilters(): void {
    this.filterType.set('');
    this.dateDebut.set('');
    this.dateFin.set('');
    this.applyFilters();
  }

  getTransactionSign(transaction: Transaction): string {
    if (transaction.type === 'DEPOT') return '+';
    if (transaction.type === 'RETRAIT') return '-';
    if (transaction.type === 'VIREMENT') {
      return transaction.numeroCompte === this.numeroCompte() ? '-' : '+';
    }
    return '';
  }

  getTransactionClass(transaction: Transaction): string {
    if (transaction.type === 'DEPOT') return 'credit';
    if (transaction.type === 'RETRAIT') return 'debit';
    if (transaction.type === 'VIREMENT') {
      return transaction.numeroCompte === this.numeroCompte() ? 'debit' : 'credit';
    }
    return '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
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
