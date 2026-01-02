import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Client } from '../../models/client.model';
import { Compte } from '../../models/compte.model';
import { Transaction } from '../../models/transaction.model';
import { ClientService } from '../../services/client.service';
import { CompteService } from '../../services/compte.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.css'
})
export class ClientDetailComponent implements OnInit {
  client: Client | null = null;
  comptes: Compte[] = [];
  transactions: Transaction[] = [];
  selectedCompte: Compte | null = null;
  showDeleteModal = false;
  showDeleteCompteModal = false;
  compteToDelete: Compte | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private compteService: CompteService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      this.loadClient(id);
    }
  }

  loadClient(id: number): void {
    this.clientService.getClientById(id).subscribe(client => {
      if (client) {
        this.client = client;
        this.loadComptes(id);
      } else {
        this.router.navigate(['/dashboard/clients']);
      }
    });
  }

  loadComptes(clientId: number): void {
    this.compteService.getComptesByClient(String(clientId)).subscribe(comptes => {
      this.comptes = comptes;
      if (comptes.length > 0) {
        this.selectCompte(comptes[0]);
      }
    });
  }

  selectCompte(compte: Compte): void {
    this.selectedCompte = compte;
    this.transactionService.getTransactionsByCompte(compte.numeroCompte).subscribe(txns => {
      this.transactions = txns;
    });
  }

  getAge(dnaissance: Date): number {
    const today = new Date();
    const birth = new Date(dnaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getTotalSolde(): number {
    return this.comptes.reduce((sum, c) => sum + c.solde, 0);
  }

  confirmDeleteClient(): void {
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.showDeleteCompteModal = false;
    this.compteToDelete = null;
  }

  deleteClient(): void {
    if (this.client) {
      this.comptes.forEach(compte => {
        this.transactionService.deleteTransactionsByCompte(compte.numeroCompte);
      });
      this.compteService.deleteComptesByClient(String(this.client.id));
      this.clientService.deleteClient(this.client.id).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/clients']);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.router.navigate(['/dashboard/clients']);
        }
      });
    }
  }

  confirmDeleteCompte(compte: Compte): void {
    this.compteToDelete = compte;
    this.showDeleteCompteModal = true;
  }

  deleteCompte(): void {
    if (this.compteToDelete) {
      this.transactionService.deleteTransactionsByCompte(this.compteToDelete.numeroCompte);
      this.compteService.deleteCompte(this.compteToDelete.numeroCompte);
      
      if (this.client) {
        this.loadComptes(this.client.id);
      }
      
      this.cancelDelete();
    }
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
