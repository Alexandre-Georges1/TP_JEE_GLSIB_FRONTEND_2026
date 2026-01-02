import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Client } from '../../models/client.model';
import { CompteService } from '../../services/compte.service';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-compte-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './compte-form.component.html',
  styleUrl: './compte-form.component.css'
})
export class CompteFormComponent implements OnInit {
  compteForm!: FormGroup;
  clients: Client[] = [];
  loading = false;
  submitError = '';
  preselectedClientId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private compteService: CompteService,
    private clientService: ClientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
    
    // Vérifier si un client est présélectionné via query params
    this.route.queryParams.subscribe(params => {
      if (params['clientId']) {
        this.preselectedClientId = parseInt(params['clientId'], 10);
        this.compteForm.patchValue({ clientId: this.preselectedClientId });
      }
    });
  }

  private initForm(): void {
    this.compteForm = this.fb.group({
      clientId: ['', [Validators.required]],
      typeCompte: ['COURANT', [Validators.required]],
      solde: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private loadClients(): void {
    this.clientService.getClients().subscribe(clients => {
      this.clients = clients;
    });
  }

  onSubmit(): void {
    if (this.compteForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.submitError = '';

    const formValue = this.compteForm.value;
    const compteData = {
      typeCompte: formValue.typeCompte,
      solde: formValue.solde,
      client: {
        id: parseInt(formValue.clientId, 10)
      }
    };

    this.compteService.createCompte(compteData).subscribe({
      next: () => {
        // Rediriger vers le client ou la liste des comptes
        if (this.preselectedClientId) {
          this.router.navigate(['/dashboard/clients', this.preselectedClientId]);
        } else {
          this.router.navigate(['/dashboard/comptes']);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la création du compte:', error);
        this.submitError = 'Une erreur est survenue. Vérifiez que tous les champs sont valides.';
        this.loading = false;
      }
    });
  }

  private markAllAsTouched(): void {
    Object.keys(this.compteForm.controls).forEach(key => {
      this.compteForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.compteForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.compteForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['min']) return 'Le montant doit être positif';

    return 'Valeur invalide';
  }
}
