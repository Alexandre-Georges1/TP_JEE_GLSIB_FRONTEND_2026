export interface User {
  id: string;
  type: 'ADMIN' | 'CLIENT';
  numeroCompte?: string;
  clientId?: string;
  nom?: string;
  prenom?: string;
}

export interface LoginCredentials {
  type: 'ADMIN' | 'CLIENT';
  numeroCompte?: string;
  password?: string;
  codeAdmin?: string;
}
