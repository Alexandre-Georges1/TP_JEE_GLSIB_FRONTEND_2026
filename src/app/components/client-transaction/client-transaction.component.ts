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

  // ...existing code...
onSubmit(): void {
  const compte = this.compte();
  if (!compte || compte.id === undefined) {
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

  // Trouver l'id du compte destination si besoin
  let compteDestinationId: number | undefined = undefined;
  if (this.transactionType() === 'VIREMENT') {
    const destination = this.allComptes().find(
      c => c.numeroCompte === this.compteDestination()
    );
    compteDestinationId = destination ? destination.id : undefined;
    if (!compteDestinationId) {
      this.errorMessage.set('Compte de destination invalide');
      this.isLoading.set(false);
      return;
    }
  }

  const formData: TransactionFormData = {
    compteId: compte.id,
    type: this.transactionType(),
    montant: this.montant(),
    compteDestinationId: compteDestinationId
  };

  this.transactionService.effectuerTransaction(formData).subscribe(result => {
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
    this.isLoading.set(false);
  });
}
// ...existing code...

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
