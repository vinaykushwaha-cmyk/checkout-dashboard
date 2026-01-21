import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: any;

  stats = {
    trialUsers: 120,
    activeSubscriptions: 860,
    renewalDue: 42,
    expired: 18
  };

  recentPayments = [
    {
      user: 'Rahul Sharma',
      plan: 'Pro',
      amount: 999,
      status: 'Active',
      expiry: '20 Feb 2026'
    },
    {
      user: 'Neha Verma',
      plan: 'Starter',
      amount: 0,
      status: 'Trial',
      expiry: '22 Jan 2026'
    },
    {
      user: 'Amit Singh',
      plan: 'Pro',
      amount: 999,
      status: 'Renewal',
      expiry: '18 Jan 2026'
    },
    {
      user: 'Pooja Gupta',
      plan: 'Basic',
      amount: 499,
      status: 'Expired',
      expiry: '05 Jan 2026'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  getUserInitials(): string {
    if (!this.user?.name) return 'U';
    const names = this.user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.user.name[0].toUpperCase();
  }

  goToSubscriptions(): void {
    this.router.navigate(['/subscriptions']);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
