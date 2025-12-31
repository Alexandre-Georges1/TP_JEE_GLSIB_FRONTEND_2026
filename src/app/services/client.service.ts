import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError, of } from 'rxjs';
import { Client, ClientFormData } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private clients$ = new BehaviorSubject<Client[]>([]);
  private storageKey = 'egabank_clients';
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/clients';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadClients();
    }
  }

  private loadClients(): void {
    this.http.get<Client[]>(this.apiUrl).pipe(
      catchError(() => {
        // En cas d'erreur, charger depuis localStorage
        this.loadFromStorage();
        return of([]);
      })
    ).subscribe(clients => {
      if (clients.length > 0) {
        this.clients$.next(clients);
      }
    });
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      const clients = JSON.parse(stored);
      this.clients$.next(clients);
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

  getClientById(id: number): Observable<Client | undefined> {
    return this.clients$.pipe(
      map(clients => clients.find(c => c.id === id))
    );
  }

  createClient(data: ClientFormData): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, data).pipe(
      tap(client => {
        const current = this.clients$.value;
        this.clients$.next([...current, client]);
        this.saveToStorage();
      }),
      catchError(error => {
        console.error('Erreur lors de la création du client:', error);
        throw error;
      })
    );
  }

  updateClient(id: number, data: Partial<ClientFormData>): Observable<boolean> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updatedClient => {
        const current = this.clients$.value;
        const index = current.findIndex(c => c.id === id);
        if (index !== -1) {
          current[index] = updatedClient;
          this.clients$.next([...current]);
          this.saveToStorage();
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Erreur lors de la mise à jour du client:', error);
        throw error;
      })
    );
  }

  deleteClient(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.clients$.value;
        const filtered = current.filter(c => c.id !== id);
        this.clients$.next(filtered);
        this.saveToStorage();
      }),
      map(() => true),
      catchError(error => {
        console.error('Erreur lors de la suppression du client:', error);
        throw error;
      })
    );
  }

  searchClients(term: string): Observable<Client[]> {
    return this.clients$.pipe(
      map(clients => clients.filter(c =>
        c.nom.toLowerCase().includes(term.toLowerCase()) ||
        c.prenom.toLowerCase().includes(term.toLowerCase()) ||
        c.courriel.toLowerCase().includes(term.toLowerCase())
      ))
    );
  }
}
