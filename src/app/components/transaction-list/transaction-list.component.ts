import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Transaction } from '../../models/transaction.model';
import { Compte } from '../../models/compte.model';
import { TransactionService } from '../../services/transaction.service';
import { CompteService } from '../../services/compte.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.css'
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  comptes: Compte[] = [];
  
  // Filtres
  selectedCompte = '';
  selectedType = '';
  dateDebut = '';
  dateFin = '';
  
  // Stats
  stats = {
    totalTransactions: 0,
    totalDepots: 0,
    totalRetraits: 0,
    totalVirements: 0,
    montantDepots: 0,
    montantRetraits: 0,
    montantVirements: 0
  };

  constructor(
    private transactionService: TransactionService,
    private compteService: CompteService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadComptes();
    
    // Vérifier les query params pour le filtre de compte
    this.route.queryParams.subscribe(params => {
      if (params['compte']) {
        this.selectedCompte = params['compte'];
      }
      this.loadTransactions();
    });
  }

  loadComptes(): void {
    this.compteService.getComptes().subscribe(comptes => {
      this.comptes = comptes;
    });
  }

  loadTransactions(): void {
    if (this.dateDebut && this.dateFin) {
      this.transactionService.getTransactionsByPeriod(
        new Date(this.dateDebut),
        new Date(this.dateFin + 'T23:59:59')
      ).subscribe(txns => {
        this.transactions = txns;
        this.applyFilters();
      });
    } else {
      this.transactionService.getTransactions().subscribe(txns => {
        this.transactions = txns;
        this.applyFilters();
      });
    }
  }

  applyFilters(): void {
    let result = [...this.transactions];

    if (this.selectedCompte) {
      result = result.filter(t => 
        t.numeroCompte === this.selectedCompte || 
        t.compteDestination === this.selectedCompte
      );
    }

    if (this.selectedType) {
      result = result.filter(t => t.type === this.selectedType);
    }

    this.filteredTransactions = result;
    this.calculateStats();
  }

  onFilterChange(): void {
    if (this.dateDebut && this.dateFin) {
      this.loadTransactions();
    } else {
      this.applyFilters();
    }
  }

  onDateChange(): void {
    this.loadTransactions();
  }

  clearFilters(): void {
    this.selectedCompte = '';
    this.selectedType = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.loadTransactions();
  }

  calculateStats(): void {
    const depots = this.filteredTransactions.filter(t => t.type === 'DEPOT');
    const retraits = this.filteredTransactions.filter(t => t.type === 'RETRAIT');
    const virements = this.filteredTransactions.filter(t => t.type === 'VIREMENT');

    this.stats = {
      totalTransactions: this.filteredTransactions.length,
      totalDepots: depots.length,
      totalRetraits: retraits.length,
      totalVirements: virements.length,
      montantDepots: depots.reduce((sum, t) => sum + t.montant, 0),
      montantRetraits: retraits.reduce((sum, t) => sum + t.montant, 0),
      montantVirements: virements.reduce((sum, t) => sum + t.montant, 0)
    };
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'DEPOT': return 'fa-arrow-down';
      case 'RETRAIT': return 'fa-arrow-up';
      case 'VIREMENT': return 'fa-exchange-alt';
      default: return 'fa-circle';
    }
  }

  getCompteInfo(numeroCompte: string): Compte | undefined {
    return this.comptes.find(c => c.numeroCompte === numeroCompte);
  }

  exportToCSV(): void {
    const headers = ['Date', 'Type', 'Compte', 'Description', 'Montant', 'Solde Après'];
    const rows = this.filteredTransactions.map(t => [
      new Date(t.date).toLocaleString('fr-FR'),
      t.type,
      t.numeroCompte,
      t.description,
      t.montant.toFixed(2),
      t.soldeApres.toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}
