import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Client } from '../../models/client.model';
import { Compte } from '../../models/compte.model';
import { ClientService } from '../../services/client.service';
import { CompteService } from '../../services/compte.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.css'
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  clientComptes: Map<string, Compte[]> = new Map();
  searchTerm = '';
  showDeleteModal = false;
  clientToDelete: Client | null = null;

  constructor(
    private clientService: ClientService,
    private compteService: CompteService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.clientService.getClients().subscribe(clients => {
      this.clients = clients;
      this.filteredClients = clients;
      
      // Charger les comptes pour chaque client
      clients.forEach(client => {
        this.compteService.getComptesByClient(client.id).subscribe(comptes => {
          this.clientComptes.set(client.id, comptes);
        });
      });
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredClients = this.clients;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(c =>
        c.nom.toLowerCase().includes(term) ||
        c.prenom.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.telephone.includes(term)
      );
    }
  }

  getClientComptes(clientId: string): Compte[] {
    return this.clientComptes.get(clientId) || [];
  }

  getTotalSolde(clientId: string): number {
    const comptes = this.getClientComptes(clientId);
    return comptes.reduce((sum, c) => sum + c.solde, 0);
  }

  confirmDelete(client: Client): void {
    this.clientToDelete = client;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.clientToDelete = null;
    this.showDeleteModal = false;
  }

  deleteClient(): void {
    if (this.clientToDelete) {
      // Supprimer les transactions des comptes du client
      const comptes = this.getClientComptes(this.clientToDelete.id);
      comptes.forEach(compte => {
        this.transactionService.deleteTransactionsByCompte(compte.numeroCompte);
      });
      
      // Supprimer les comptes du client
      this.compteService.deleteComptesByClient(this.clientToDelete.id);
      
      // Supprimer le client
      this.clientService.deleteClient(this.clientToDelete.id);
      
      this.cancelDelete();
    }
  }

  getAge(dateNaissance: Date): number {
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
