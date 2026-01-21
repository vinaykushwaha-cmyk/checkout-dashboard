import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { SubscriptionService, Subscription, Plan, Product } from '../../services/subscription.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule
  ],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss'
})
export class SubscriptionsComponent implements OnInit {
  user: any;
  subscriptions: Subscription[] = [];
  plans: Plan[] = [];
  products: Product[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  itemsPerPage = 10;

  filters = {
    productName: '',
    productId: '',
    planName: '',
    period: '',
    startDate: null as Date | null,
    renewalDate: null as Date | null
  };

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
    this.loadPlans();
    this.loadProducts();
    this.loadSubscriptions();
  }

  loadPlans(productName?: string): void {
    this.subscriptionService.getPlans(productName).subscribe({
      next: (response) => {
        this.plans = response.data;
      },
      error: (error) => {
        console.error('Error loading plans:', error);
      }
    });
  }

  onProductChange(): void {
    // Reset plan name when product changes
    this.filters.planName = '';

    // Load plans for the selected product
    if (this.filters.productName) {
      this.loadPlans(this.filters.productName);
    } else {
      // Load all plans if no product selected
      this.loadPlans();
    }
  }

  loadProducts(): void {
    this.subscriptionService.getProducts().subscribe({
      next: (response) => {
        this.products = response.data;
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  loadSubscriptions(): void {
    this.loading = true;

    // Format dates for API
    const formattedFilters = {
      productName: this.filters.productName,
      productId: this.filters.productId,
      planName: this.filters.planName,
      period: this.filters.period,
      startDate: this.filters.startDate ? this.formatDate(this.filters.startDate) : '',
      renewalDate: this.filters.renewalDate ? this.formatDate(this.filters.renewalDate) : ''
    };

    console.log('Filters:', this.filters);
    console.log('Formatted Filters:', formattedFilters);

    this.subscriptionService.getSubscriptions(this.currentPage, this.itemsPerPage, formattedFilters)
      .subscribe({
        next: (response) => {
          this.subscriptions = response.data;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
          this.totalItems = response.pagination.totalItems;
          this.itemsPerPage = response.pagination.itemsPerPage;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading subscriptions:', error);
          this.loading = false;
        }
      });
  }

  formatDate(date: Date): string {
    // Create a new date object to avoid timezone issues
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    console.log('Formatting date:', date, 'to:', formatted);
    return formatted;
  }

  applyFilters(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.loadSubscriptions();
  }

  clearFilters(): void {
    this.filters = {
      productName: '',
      productId: '',
      planName: '',
      period: '',
      startDate: null,
      renewalDate: null
    };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.filters.productName !== '' ||
           this.filters.productId !== '' ||
           this.filters.planName !== '' ||
           this.filters.period !== '' ||
           this.filters.startDate !== null ||
           this.filters.renewalDate !== null;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadSubscriptions();
  }

  getSerialNumber(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index + 1;
  }

  getUserInitials(): string {
    if (!this.user?.name) return 'U';
    const names = this.user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.user.name[0].toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'status-active';
      case 'Expired':
        return 'status-expired';
      case 'Expiring Soon':
        return 'status-expiring';
      default:
        return 'status-unknown';
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToSubscriptions(): void {
    // Already on subscriptions page
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
