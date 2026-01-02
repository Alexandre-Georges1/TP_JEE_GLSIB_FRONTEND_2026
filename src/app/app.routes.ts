import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Redirection par défaut vers login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  
  // Page de connexion
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  
  // Espace Client
  {
    path: 'client',
    canActivate: [AuthGuard],
    data: { role: 'CLIENT' },
    children: [
      {
        path: '',
        loadComponent: () => import('./components/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent)
      },
      {
        path: 'transaction',
        loadComponent: () => import('./components/client-transaction/client-transaction.component').then(m => m.ClientTransactionComponent)
      },
      {
        path: 'historique',
        loadComponent: () => import('./components/client-historique/client-historique.component').then(m => m.ClientHistoriqueComponent)
      },
      {
        path: 'releve',
        loadComponent: () => import('./components/client-releve/client-releve.component').then(m => m.ClientReleveComponent)
      }
    ]
  },

  // Espace Admin (Dashboard principal)
  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMIN' },
    children: [
      {
        path: '',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./components/client-list/client-list.component').then(m => m.ClientListComponent)
      },
      {
        path: 'clients/new',
        loadComponent: () => import('./components/client-form/client-form.component').then(m => m.ClientFormComponent)
      },
      {
        path: 'clients/:id',
        loadComponent: () => import('./components/client-detail/client-detail.component').then(m => m.ClientDetailComponent)
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () => import('./components/client-form/client-form.component').then(m => m.ClientFormComponent)
      },
      {
        path: 'comptes',
        loadComponent: () => import('./components/compte-list/compte-list.component').then(m => m.CompteListComponent)
      },
      {
        path: 'comptes/new',
        loadComponent: () => import('./components/compte-form/compte-form.component').then(m => m.CompteFormComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./components/transaction-list/transaction-list.component').then(m => m.TransactionListComponent)
      },
      {
        path: 'transactions/new',
        loadComponent: () => import('./components/transaction-form/transaction-form.component').then(m => m.TransactionFormComponent)
      }
    ]
  },
  // Redirection par défaut vers login pour toutes les routes inconnues
  {
    path: '**',
    redirectTo: 'login'
  }
];
