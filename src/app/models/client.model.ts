export interface Client {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: 'M' | 'F';
  adresse: string;
  telephone: string;
  email: string;
  nationalite: string;
  dateCreation: Date;
}

export interface ClientFormData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: 'M' | 'F';
  adresse: string;
  telephone: string;
  email: string;
  nationalite: string;
}
