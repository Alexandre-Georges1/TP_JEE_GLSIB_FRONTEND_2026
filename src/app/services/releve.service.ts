import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface ReleveData {
  compte: {
    numeroCompte: string;
    client: {
      nom: string;
      prenom: string;
    };
    solde: number;
  };
  dateDebut: string;
  dateFin: string;
  nombreTransactions: number;
  soldeDebut: number;
  soldeFin: number;
  totalCredits: number;
  totalDebits: number;
  transactions: ReleveTransaction[];
}

export interface ReleveTransaction {
  id: number;
  dateTransaction: string;
  type: string;
  description?: string;
  montant: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReleveService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api';

  getReleveData(compteId: number, dateDebut: string, dateFin: string): Observable<ReleveData> {
    return this.http.get<ReleveData>(
      `${this.apiUrl}/releves/compte/${compteId}?dateDebut=${dateDebut}&dateFin=${dateFin}`
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération du relevé:', error);
        throw error;
      })
    );
  }

  getRelevePdfUrl(compteId: number, dateDebut: string, dateFin: string): string {
    return `${this.apiUrl}/releves/compte/${compteId}/pdf?dateDebut=${dateDebut}&dateFin=${dateFin}`;
  }
}
