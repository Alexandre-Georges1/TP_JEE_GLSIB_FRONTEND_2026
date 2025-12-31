import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CompteService } from '../../services/compte.service';
import { TransactionService } from '../../services/transaction.service';
import { Compte } from '../../models/compte.model';
import { TypeTransaction, TransactionFormData } from '../../models/transaction.model';

@Component({
  selector: 'app-client-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './client-transaction.component.html',
  styleUrl: './client-transaction.component.css'
})
export class ClientTransactionComponent implements OnInit {
  transactionType = signal<TypeTransaction>('DEPOT');
  compte = signal<Compte | null>(null);
  allComptes = signal<Compte[]>([]);
  
  montant = signal<number>(0);
  compteDestination = signal<string>('');
  
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private authService: AuthService,
    private compteService: CompteService,
    private transactionService: TransactionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupérer les paramètres de l'URL
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.transactionType.set(params['type'] as TypeTransaction);
      }
      if (params['compte']) {
        this.compteService.getCompteByNumero(params['compte']).subscribe(compte => {
          this.compte.set(compte || null);
        });
      }
    });

    // Charger tous les comptes pour les virements
    this.compteService.getComptes().subscribe(comptes => {
      this.allComptes.set(comptes);
    });
  }

  get otherComptes(): Compte[] {
    return this.allComptes().filter(c => c.numeroCompte !== this.compte()?.numeroCompte);
  }

  setType(type: TypeTransaction): void {
    this.transactionType.set(type);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  async onSubmit(): Promise<void> {
    if (!this.compte()) {
      this.errorMessage.set('Compte non trouvé');
      return;
    }

    if (this.montant() <= 0) {
      this.errorMessage.set('Le montant doit être supérieur à 0');
      return;
    }

    if (this.transactionType() === 'VIREMENT' && !this.compteDestination()) {
      this.errorMessage.set('Veuillez sélectionner un compte de destination');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formData: TransactionFormData = {
      numeroCompte: this.compte()!.numeroCompte,
      type: this.transactionType(),
      montant: this.montant(),
      compteDestination: this.transactionType() === 'VIREMENT' ? this.compteDestination() : undefined
    };

    try {
      const result = await this.transactionService.effectuerTransaction(formData);
      
      if (result.success) {
        this.successMessage.set(this.getSuccessMessage());
        // Recharger le compte pour avoir le nouveau solde
        this.compteService.getCompteByNumero(this.compte()!.numeroCompte).subscribe(updatedCompte => {
          this.compte.set(updatedCompte || null);
        });
        this.montant.set(0);
        this.compteDestination.set('');
      } else {
        this.errorMessage.set(result.message);
      }
    } catch (error) {
      this.errorMessage.set('Une erreur est survenue');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getSuccessMessage(): string {
    switch (this.transactionType()) {
      case 'DEPOT': return 'Dépôt effectué avec succès !';
      case 'RETRAIT': return 'Retrait effectué avec succès !';
      case 'VIREMENT': return 'Virement effectué avec succès !';
      default: return 'Transaction effectuée !';
    }
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
