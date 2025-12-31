import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Client, ClientFormData } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private clients$ = new BehaviorSubject<Client[]>([]);
  private storageKey = 'egabank_clients';
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      const clients = JSON.parse(stored).map((c: any) => ({
        ...c,
        dateNaissance: new Date(c.dateNaissance),
        dateCreation: new Date(c.dateCreation)
      }));
      this.clients$.next(clients);
    } else {
      // Données de démonstration
      const demoClients: Client[] = [
        {
          id: this.generateId(),
          nom: 'Dupont',
          prenom: 'Jean',
          dateNaissance: new Date('1985-03-15'),
          sexe: 'M',
          adresse: '123 Rue de la Paix, Paris',
          telephone: '+33 6 12 34 56 78',
          email: 'jean.dupont@email.com',
          nationalite: 'Française',
          dateCreation: new Date()
        },
        {
          id: this.generateId(),
          nom: 'Martin',
          prenom: 'Marie',
          dateNaissance: new Date('1990-07-22'),
          sexe: 'F',
          adresse: '456 Avenue des Champs, Lyon',
          telephone: '+33 6 98 76 54 32',
          email: 'marie.martin@email.com',
          nationalite: 'Française',
          dateCreation: new Date()
        }
      ];
      this.clients$.next(demoClients);
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.clients$.value));
  }

  private generateId(): string {
    return 'CLT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  }

  getClients(): Observable<Client[]> {
    return this.clients$.asObservable();
  }

  getClientById(id: string): Observable<Client | undefined> {
    return this.clients$.pipe(
      map(clients => clients.find(c => c.id === id))
    );
  }

  createClient(data: ClientFormData): Client {
    const newClient: Client = {
      id: this.generateId(),
      nom: data.nom,
      prenom: data.prenom,
      dateNaissance: new Date(data.dateNaissance),
      sexe: data.sexe,
      adresse: data.adresse,
      telephone: data.telephone,
      email: data.email,
      nationalite: data.nationalite,
      dateCreation: new Date()
    };

    const current = this.clients$.value;
    this.clients$.next([...current, newClient]);
    this.saveToStorage();
    return newClient;
  }

  updateClient(id: string, data: Partial<ClientFormData>): boolean {
    const current = this.clients$.value;
    const index = current.findIndex(c => c.id === id);
    
    if (index === -1) return false;

    const updated = {
      ...current[index],
      ...data,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : current[index].dateNaissance
    };

    current[index] = updated;
    this.clients$.next([...current]);
    this.saveToStorage();
    return true;
  }

  deleteClient(id: string): boolean {
    const current = this.clients$.value;
    const filtered = current.filter(c => c.id !== id);
    
    if (filtered.length === current.length) return false;

    this.clients$.next(filtered);
    this.saveToStorage();
    return true;
  }

  searchClients(term: string): Observable<Client[]> {
    return this.clients$.pipe(
      map(clients => clients.filter(c =>
        c.nom.toLowerCase().includes(term.toLowerCase()) ||
        c.prenom.toLowerCase().includes(term.toLowerCase()) ||
        c.email.toLowerCase().includes(term.toLowerCase())
      ))
    );
  }
}
