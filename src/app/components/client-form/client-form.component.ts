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
  clientId: string | null = null;
  loading = false;
  submitError = '';

  nationalities = [
    'Française', 'Gabonaise', 'Camerounaise', 'Sénégalaise', 'Ivoirienne',
    'Congolaise', 'Marocaine', 'Algérienne', 'Tunisienne', 'Belge',
    'Suisse', 'Canadienne', 'Américaine', 'Britannique', 'Allemande',
    'Espagnole', 'Italienne', 'Portugaise', 'Autre'
  ];

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId && this.clientId !== 'new') {
      this.isEditMode = true;
      this.loadClient();
    }
  }

  private initForm(): void {
    this.clientForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      dateNaissance: ['', [Validators.required]],
      sexe: ['M', [Validators.required]],
      adresse: ['', [Validators.required, Validators.minLength(5)]],
      telephone: ['', [Validators.required, Validators.pattern(/^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      nationalite: ['', [Validators.required]]
    });
  }

  private loadClient(): void {
    if (!this.clientId) return;

    this.clientService.getClientById(this.clientId).subscribe(client => {
      if (client) {
        const dateStr = new Date(client.dateNaissance).toISOString().split('T')[0];
        this.clientForm.patchValue({
          nom: client.nom,
          prenom: client.prenom,
          dateNaissance: dateStr,
          sexe: client.sexe,
          adresse: client.adresse,
          telephone: client.telephone,
          email: client.email,
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

    try {
      if (this.isEditMode && this.clientId) {
        this.clientService.updateClient(this.clientId, this.clientForm.value);
      } else {
        this.clientService.createClient(this.clientForm.value);
      }
      this.router.navigate(['/clients']);
    } catch (error) {
      this.submitError = 'Une erreur est survenue. Veuillez réessayer.';
      this.loading = false;
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
