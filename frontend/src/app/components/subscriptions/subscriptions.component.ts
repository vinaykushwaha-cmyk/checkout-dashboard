import { Component, OnInit, Inject } from '@angular/core';
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
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
    MatSelectModule,
    MatDialogModule
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
    private router: Router,
    private dialog: MatDialog
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

  canCancelSubscription(paymentMethod: string | null | undefined): boolean {
    if (!paymentMethod) return false;
    const cancellablePaymentMethods = ['paypal', 'ebanx', 'stripe', 'ccavenue', 'razorpay'];
    return cancellablePaymentMethods.includes(paymentMethod.toLowerCase());
  }

  cancelSubscription(subscription: Subscription): void {
    const dialogRef = this.dialog.open(CancelSubscriptionDialogComponent, {
      width: '500px',
      data: { subscription }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Call backend API to cancel subscription
        const cancelData = {
          subscriptionId: subscription.id,
          productId: subscription.product_id,
          userId: subscription.user_id,
          productName: subscription.product_name,
          comment: result.comment || '',
          cancelledType: subscription.payment_method || 'manual'
        };

        this.subscriptionService.cancelSubscription(cancelData).subscribe({
          next: (response) => {
            console.log('Subscription cancelled successfully:', response.message);
            alert(response.message || 'Subscription cancelled successfully');
            // Reload subscriptions after cancellation
            this.loadSubscriptions();
          },
          error: (error) => {
            console.error('Error cancelling subscription:', error);
            alert('Error cancelling subscription: ' + (error.error?.message || error.message));
          }
        });
      }
    });
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

// Cancel Subscription Dialog Component
@Component({
  selector: 'app-cancel-subscription-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Cancel Subscription</h2>

      <mat-dialog-content>
        <div class="confirmation-message">
          <p class="warning-text">Are you sure you want to cancel?</p>
          <div class="subscription-details">
            <p><strong>Product:</strong> {{ data.subscription.product_name }}</p>
            <p><strong>Plan:</strong> {{ data.subscription.plan_name }}</p>
          </div>
        </div>

        <mat-form-field appearance="outline" class="comment-field">
          <mat-label>Comment</mat-label>
          <textarea
            matInput
            [(ngModel)]="comment"
            placeholder="Enter your reason for cancellation (optional)"
            rows="4"
            maxlength="500">
          </textarea>
          <mat-hint align="end">{{ comment.length }}/500</mat-hint>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-raised-button (click)="onCancel()">No, Keep It</button>
        <button mat-raised-button color="warn" (click)="onSubmit()">Yes, Cancel</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 10px;
    }

    h2 {
      color: #2c3e50;
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 600;
    }

    mat-dialog-content {
      padding: 20px 0;
      min-height: 200px;
    }

    .confirmation-message {
      margin-bottom: 24px;
    }

    .warning-text {
      font-size: 18px;
      font-weight: 600;
      color: #dc3545;
      margin: 0 0 16px 0;
    }

    .subscription-details {
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .subscription-details p {
      margin: 8px 0;
      font-size: 14px;
      color: #2c3e50;
    }

    .subscription-details strong {
      font-weight: 600;
      color: #34495e;
    }

    .comment-field {
      width: 100%;
      font-size: 14px;
    }

    .comment-field textarea {
      resize: vertical;
      min-height: 80px;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      gap: 12px;
    }

    mat-dialog-actions button {
      min-width: 120px;
      font-weight: 500;
    }
  `]
})
export class CancelSubscriptionDialogComponent {
  comment: string = '';

  constructor(
    public dialogRef: MatDialogRef<CancelSubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { subscription: Subscription }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close({ comment: this.comment });
  }
}
