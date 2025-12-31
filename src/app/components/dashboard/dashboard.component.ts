import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Client } from '../../models/client.model';
import { Transaction } from '../../models/transaction.model';
import { ClientService } from '../../services/client.service';
import { CompteService } from '../../services/compte.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats = {
    totalClients: 0,
    totalComptes: 0,
    comptesEpargne: 0,
    comptesCourant: 0,
    soldeTotal: 0,
    totalTransactions: 0
  };

  recentTransactions: Transaction[] = [];
  recentClients: Client[] = [];

  constructor(
    private clientService: ClientService,
    private compteService: CompteService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentData();
  }

  loadStats(): void {
    this.clientService.getClients().subscribe(clients => {
      this.stats.totalClients = clients.length;
      this.recentClients = clients.slice(-5).reverse();
    });

    this.compteService.getComptesCount().subscribe(counts => {
      this.stats.totalComptes = counts.total;
      this.stats.comptesEpargne = counts.epargne;
      this.stats.comptesCourant = counts.courant;
    });

    this.compteService.getTotalSolde().subscribe(solde => {
      this.stats.soldeTotal = solde;
    });

    this.transactionService.getTransactions().subscribe(txns => {
      this.stats.totalTransactions = txns.length;
    });
  }

  loadRecentData(): void {
    this.transactionService.getRecentTransactions(5).subscribe(txns => {
      this.recentTransactions = txns;
    });
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'DEPOT': return 'fa-arrow-down';
      case 'RETRAIT': return 'fa-arrow-up';
      case 'VIREMENT': return 'fa-exchange-alt';
      default: return 'fa-circle';
    }
  }
}
