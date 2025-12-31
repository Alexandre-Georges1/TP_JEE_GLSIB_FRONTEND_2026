export type TypeCompte = 'EPARGNE' | 'COURANT';

export interface Compte {
  numeroCompte: string;
  typeCompte: TypeCompte;
  dateCreation: Date;
  solde: number;
  clientId: string;
  clientNom?: string;
  clientPrenom?: string;
}

export interface CompteFormData {
  typeCompte: TypeCompte;
  soldeInitial: number;
  clientId: string;
}
