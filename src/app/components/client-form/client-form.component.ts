import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.css'
})
export class ClientFormComponent implements OnInit {
  clientForm!: FormGroup;
  isEditMode = false;
  clientId: number | null = null;
  loading = false;
  submitError = '';

  nationalities = [
    'Française', 'Togolaise', 'Camerounaise', 'Sénégalaise', 'Ivoirienne',
    'Congolaise', 'Marocaine', 'Algérienne', 'Tunisienne', 'Belge',
    'Nigérienne', 'Canadienne', 'Américaine', 'Britannique', 'Béninoise',
    'Espagnole', 'Italienne', 'Américaine', 'Autre'
  ];

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.clientId = parseInt(idParam, 10);
      this.isEditMode = true;
      this.loadClient();
    }
  }

  private initForm(): void {
    this.clientForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      dnaissance: ['', [Validators.required]],
      sexe: ['M', [Validators.required]],
      adresse: ['', [Validators.required, Validators.minLength(5)]],
      tel: ['', [Validators.required, Validators.pattern(/^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/)]],
      courriel: ['', [Validators.required, Validators.email]],
      nationalite: ['', [Validators.required]]
    });
  }

  private loadClient(): void {
    if (!this.clientId) return;

    this.clientService.getClientById(this.clientId).subscribe(client => {
      if (client) {
        const dateStr = typeof client.dnaissance === 'string' 
          ? client.dnaissance 
          : client.dnaissance;
        this.clientForm.patchValue({
          nom: client.nom,
          prenom: client.prenom,
          dnaissance: dateStr,
          sexe: client.sexe,
          adresse: client.adresse,
          tel: client.tel,
          courriel: client.courriel,
          nationalite: client.nationalite
        });
      } else {
        this.router.navigate(['/clients']);
      }
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.submitError = '';

    if (this.isEditMode && this.clientId) {
      this.clientService.updateClient(this.clientId, this.clientForm.value).subscribe({
        next: () => {
          this.router.navigate(['/clients']);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.submitError = 'Une erreur est survenue. Veuillez réessayer.';
          this.loading = false;
        }
      });
    } else {
      this.clientService.createClient(this.clientForm.value).subscribe({
        next: () => {
          this.router.navigate(['/clients']);
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.submitError = 'Une erreur est survenue. Veuillez réessayer.';
          this.loading = false;
        }
      });
    }
  }

  private markAllAsTouched(): void {
    Object.keys(this.clientForm.controls).forEach(key => {
      this.clientForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.clientForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.clientForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    if (field.errors['email']) return 'Email invalide';
    if (field.errors['pattern']) return 'Format invalide';

    return 'Valeur invalide';
  }
}
