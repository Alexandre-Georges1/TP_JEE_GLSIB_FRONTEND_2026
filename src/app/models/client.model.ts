export interface Client {
  id: number;
  nom: string;
  prenom: string;
  dnaissance: Date;
  sexe: string;
  adresse: string;

  clientId?: number;   
  client?: Client;

  tel: string;
  courriel: string;
  nationalite: string;
}

export interface ClientFormData {
  nom: string;
  prenom: string;
  dnaissance: Date;
  sexe: string;
  adresse: string;
  tel: string;
  courriel: string;
  nationalite: string;
}
