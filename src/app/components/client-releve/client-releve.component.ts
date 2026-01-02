import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CompteService } from '../../services/compte.service';
import { ReleveService, ReleveData, ReleveTransaction } from '../../services/releve.service';
import { Compte } from '../../models/compte.model';

@Component({
  selector: 'app-client-releve',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './client-releve.component.html',
  styleUrl: './client-releve.component.css'
})
export class ClientReleveComponent implements OnInit {
  comptes = signal<Compte[]>([]);
  selectedCompteId = signal<number | null>(null);
  dateDebut = signal<string>('');
  dateFin = signal<string>('');
  
  releveData = signal<ReleveData | null>(null);
  loading = signal<boolean>(false);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  today = new Date().toISOString();

  constructor(
    public authService: AuthService,
    private compteService: CompteService,
    private releveService: ReleveService
  ) {}

  ngOnInit(): void {
    this.loadComptes();
    this.setDefaultDates();
  }

  private loadComptes(): void {
    const user = this.authService.currentUser;
    if (user?.clientId) {
      this.compteService.getComptesByClient(user.clientId).subscribe(comptes => {
        this.comptes.set(comptes);
        // Sélectionner le premier compte par défaut
        if (comptes.length > 0 && comptes[0].id) {
          this.selectedCompteId.set(comptes[0].id);
        }
      });
    }
  }

  private setDefaultDates(): void {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    this.dateDebut.set(this.formatDateForInput(lastMonth));
    this.dateFin.set(this.formatDateForInput(today));
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  afficherReleve(): void {
    if (!this.selectedCompteId() || !this.dateDebut() || !this.dateFin()) {
      this.showMessage('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (new Date(this.dateDebut()) > new Date(this.dateFin())) {
      this.showMessage('La date de début doit être antérieure à la date de fin', 'error');
      return;
    }

    this.loading.set(true);
    this.releveData.set(null);

    this.releveService.getReleveData(
      this.selectedCompteId()!,
      this.dateDebut(),
      this.dateFin()
    ).subscribe({
      next: (data) => {
        this.releveData.set(data);
        this.showMessage('Relevé chargé avec succès', 'success');
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.showMessage('Erreur lors de la récupération du relevé', 'error');
        this.loading.set(false);
      }
    });
  }

  telechargerPDF(): void {
    if (!this.selectedCompteId() || !this.dateDebut() || !this.dateFin()) {
      this.showMessage('Veuillez remplir tous les champs', 'error');
      return;
    }

    const url = this.releveService.getRelevePdfUrl(
      this.selectedCompteId()!,
      this.dateDebut(),
      this.dateFin()
    );

    this.showMessage('Téléchargement du PDF en cours...', 'success');
    window.open(url, '_blank');
  }

  imprimerReleve(): void {
    window.print();
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 5000);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  isCredit(type: string): boolean {
    return type === 'DEPOT' || type === 'VIREMENT_RECU';
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'DEPOT': return 'Dépôt';
      case 'RETRAIT': return 'Retrait';
      case 'VIREMENT_RECU': return 'Virement reçu';
      case 'VIREMENT_EMIS': return 'Virement émis';
      case 'VIREMENT': return 'Virement';
      default: return type;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
