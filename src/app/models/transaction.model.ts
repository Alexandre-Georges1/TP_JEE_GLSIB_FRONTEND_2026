import { Compte } from './compte.model';

export type TypeTransaction = 'DEPOT' | 'RETRAIT' | 'VIREMENT';

// Interface correspondant à l'entité backend
export interface Transaction {
  id?: number;
  dateTransaction: Date;
  type: string;
  montantAvant: number;
  montantApres: number;
  montant: number;
  compte?: Compte;
  
  numeroCompte?: string;
  description?: string;
  compteDestination?: string;
}

export interface TransactionFormData {
  compteId: number;
  type: TypeTransaction;
  montant: number;
  compteDestinationId?: number;
}
export interface DeposerRetirerRequest {
  montant: number;
}
export interface TransfererRequest {
  montant: number;
  id: number;  
}
