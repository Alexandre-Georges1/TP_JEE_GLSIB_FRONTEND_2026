import { Client } from './client.model';
import { Transaction } from './transaction.model';

export type TypeCompte = 'EPARGNE' | 'COURANT';

export interface Compte {
  id?: number;
  numeroCompte: string;
  dateCreation: Date;
  typeCompte: string;
  solde: number;
  client?: Client;
  transactions?: Transaction[];
  // Champs ajoutés pour affichage
  clientNom?: string;
  clientPrenom?: string;
}

export interface CompteFormData {
  typeCompte: string;
  solde: number;
  client: {
    id: number;
  };
}
