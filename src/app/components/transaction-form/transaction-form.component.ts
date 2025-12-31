import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Compte } from '../../models/compte.model';
import { TransactionFormData } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';
import { CompteService } from '../../services/compte.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.css'
})
export class TransactionFormComponent implements OnInit {
  transactionForm!: FormGroup;
  comptes: Compte[] = [];
  comptesDestination: Compte[] = [];
  selectedCompte: Compte | null = null;
  loading = false;
  submitError = '';
  submitSuccess = '';
  preselectedType: string | null = null;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private compteService: CompteService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadComptes();
    
    // Vérifier les query params
    this.route.queryParams.subscribe(params => {
      if (params['compte']) {
        // Trouver le compte par numéro et définir l'ID
        this.compteService.getCompteByNumero(params['compte']).subscribe(compte => {
          if (compte && compte.id) {
            this.transactionForm.patchValue({ compteId: compte.id });
            this.onCompteChange();
          }
        });
      }
      if (params['type']) {
        this.preselectedType = params['type'];
        this.transactionForm.patchValue({ type: params['type'] });
      }
    });
  }

  private initForm(): void {
    this.transactionForm = this.fb.group({
      compteId: [null, [Validators.required]],
      type: ['DEPOT', [Validators.required]],
      montant: [null, [Validators.required, Validators.min(0.01)]],
      compteDestinationId: [null]
    });

    // Ajouter la validation conditionnelle pour le virement
    this.transactionForm.get('type')?.valueChanges.subscribe(type => {
      const compteDestinationControl = this.transactionForm.get('compteDestinationId');
      if (type === 'VIREMENT') {
        compteDestinationControl?.setValidators([Validators.required]);
      } else {
        compteDestinationControl?.clearValidators();
      }
      compteDestinationControl?.updateValueAndValidity();
    });
  }

  private loadComptes(): void {
    this.compteService.getComptes().subscribe(comptes => {
      this.comptes = comptes;
    });
  }

  onCompteChange(): void {
    const compteId = this.transactionForm.get('compteId')?.value;
    this.selectedCompte = this.comptes.find(c => c.id === compteId) || null;
    
    // Mettre à jour la liste des comptes destination (exclure le compte sélectionné)
    this.comptesDestination = this.comptes.filter(c => c.id !== compteId);
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.submitError = '';
    this.submitSuccess = '';

    const formValue = this.transactionForm.value;
    const transactionData: TransactionFormData = {
      compteId: formValue.compteId,
      type: formValue.type,
      montant: formValue.montant,
      compteDestinationId: formValue.compteDestinationId
    };

    this.transactionService.effectuerTransaction(transactionData).subscribe({
      next: (result) => {
        if (result.success) {
          this.submitSuccess = result.message;
          
          // Rafraîchir les infos du compte
          this.loadComptes();
          setTimeout(() => {
            this.onCompteChange();
          }, 100);
          
          // Reset le formulaire partiellement
          this.transactionForm.patchValue({
            montant: null,
            compteDestinationId: null
          });
          
          // Optionnel : effacer le message après quelques secondes
          setTimeout(() => {
            this.submitSuccess = '';
          }, 3000);
        } else {
          this.submitError = result.message;
        }
        this.loading = false;
      },
      error: () => {
        this.submitError = 'Une erreur est survenue. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  private markAllAsTouched(): void {
    Object.keys(this.transactionForm.controls).forEach(key => {
      this.transactionForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.transactionForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.transactionForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['min']) return 'Le montant doit être supérieur à 0';

    return 'Valeur invalide';
  }

  get isVirement(): boolean {
    return this.transactionForm.get('type')?.value === 'VIREMENT';
  }
}
