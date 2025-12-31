export type TypeTransaction = 'DEPOT' | 'RETRAIT' | 'VIREMENT';

export interface Transaction {
  id: string;
  numeroCompte: string;
  type: TypeTransaction;
  montant: number;
  date: Date;
  description: string;
  soldeApres: number;
  compteSource?: string;
  compteDestination?: string;
}

export interface TransactionFormData {
  numeroCompte: string;
  type: TypeTransaction;
  montant: number;
  description?: string;
  compteSource?: string;
  compteDestination?: string;
}
