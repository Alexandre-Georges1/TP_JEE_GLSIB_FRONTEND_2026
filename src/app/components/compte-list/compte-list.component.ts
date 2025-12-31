import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Compte } from '../../models/compte.model';
import { CompteService } from '../../services/compte.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-compte-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './compte-list.component.html',
  styleUrl: './compte-list.component.css'
})
export class CompteListComponent implements OnInit {
  comptes: Compte[] = [];
  filteredComptes: Compte[] = [];
  searchTerm = '';
  filterType: 'all' | 'EPARGNE' | 'COURANT' = 'all';
  showDeleteModal = false;
  compteToDelete: Compte | null = null;

  stats = {
    totalComptes: 0,
    totalEpargne: 0,
    totalCourant: 0,
    soldeTotalEpargne: 0,
    soldeTotalCourant: 0,
    soldeTotal: 0
  };

  constructor(
    private compteService: CompteService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadComptes();
  }

  loadComptes(): void {
    this.compteService.getComptes().subscribe(comptes => {
      this.comptes = comptes;
      this.applyFilters();
      this.calculateStats();
    });
  }

  applyFilters(): void {
    let result = [...this.comptes];

    // Filtre par type
    if (this.filterType !== 'all') {
      result = result.filter(c => c.typeCompte === this.filterType);
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c =>
        c.numeroCompte.toLowerCase().includes(term) ||
        c.clientNom?.toLowerCase().includes(term) ||
        c.clientPrenom?.toLowerCase().includes(term)
      );
    }

    this.filteredComptes = result;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  calculateStats(): void {
    const epargne = this.comptes.filter(c => c.typeCompte === 'EPARGNE');
    const courant = this.comptes.filter(c => c.typeCompte === 'COURANT');

    this.stats = {
      totalComptes: this.comptes.length,
      totalEpargne: epargne.length,
      totalCourant: courant.length,
      soldeTotalEpargne: epargne.reduce((sum, c) => sum + c.solde, 0),
      soldeTotalCourant: courant.reduce((sum, c) => sum + c.solde, 0),
      soldeTotal: this.comptes.reduce((sum, c) => sum + c.solde, 0)
    };
  }

  confirmDelete(compte: Compte): void {
    this.compteToDelete = compte;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.compteToDelete = null;
    this.showDeleteModal = false;
  }

  deleteCompte(): void {
    if (this.compteToDelete) {
      this.transactionService.deleteTransactionsByCompte(this.compteToDelete.numeroCompte);
      this.compteService.deleteCompte(this.compteToDelete.numeroCompte);
      this.cancelDelete();
    }
  }
}
