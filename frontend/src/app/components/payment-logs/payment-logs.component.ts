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
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  PaymentLogService,
  PaymentLog,
  PaymentLogSummary,
  PaymentLogFilters,
  FilterOption,
  Product,
  Addon
} from '../../services/payment-log.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-payment-logs',
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
    MatTooltipModule
  ],
  templateUrl: './payment-logs.component.html',
  styleUrl: './payment-logs.component.scss'
})
export class PaymentLogsComponent implements OnInit {
  user: any;
  paymentLogs: PaymentLog[] = [];
  loading = false;
  filtersLoading = true;
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  itemsPerPage = 10;

  summary: PaymentLogSummary = {
    trial: { count: 0, amount: 0 },
    upgrade: { count: 0, amount: 0 },
    renewal: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 }
  };

  filters: PaymentLogFilters = {
    searchByAppId: '',
    searchByAppIdOrTransaction: '',
    searchDate: '',
    subscriptionType: '',
    productId: '',
    subscriptionPeriod: '',
    addons: '',
    paymentMode: '',
    paymentSource: '',
    claimedUser: '',
    language: ''
  };

  searchDate: Date | null = null;

  // Dynamic filter options - loaded from API
  products: Product[] = [];
  addons: Addon[] = [];
  subscriptionTypes: FilterOption[] = [];
  subscriptionPeriods: FilterOption[] = [];
  paymentModes: FilterOption[] = [];
  paymentSources: FilterOption[] = [];
  claimedUsers: FilterOption[] = [];
  languages: FilterOption[] = [];

  constructor(
    private paymentLogService: PaymentLogService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
    this.loadAllFilters();
    this.loadPaymentLogs();
  }

  loadAllFilters(): void {
    this.filtersLoading = true;
    this.paymentLogService.getAllFilters().subscribe({
      next: (response) => {
        this.products = response.data.products;
        this.addons = response.data.addons;
        this.subscriptionTypes = response.data.subscriptionTypes;
        this.paymentModes = response.data.paymentModes;
        this.paymentSources = response.data.paymentSources;
        this.subscriptionPeriods = response.data.subscriptionPeriods;
        this.languages = response.data.languages;
        this.claimedUsers = response.data.claimedUsers;
        this.filtersLoading = false;
      },
      error: (error) => {
        console.error('Error loading filters:', error);
        this.filtersLoading = false;
        // Set default values if API fails
        this.setDefaultFilters();
      }
    });
  }

  setDefaultFilters(): void {
    this.subscriptionTypes = [
      { value: 'trial', label: 'Trial' },
      { value: 'upgrade', label: 'Upgrade' },
      { value: 'renewal', label: 'Renewal' }
    ];
    this.subscriptionPeriods = [
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
      { value: 'lifetime', label: 'Lifetime' }
    ];
    this.paymentModes = [
      { value: 'stripe', label: 'Stripe' },
      { value: 'paypal', label: 'PayPal' },
      { value: 'razorpay', label: 'Razorpay' },
      { value: 'ccavenue', label: 'CCAvenue' },
      { value: 'ebanx', label: 'Ebanx' }
    ];
    this.paymentSources = [
      { value: 'web', label: 'Web' },
      { value: 'Manual', label: 'Manual' },
      { value: 'ios', label: 'iOS' },
      { value: 'android', label: 'Android' }
    ];
    this.claimedUsers = [
      { value: 'claimed', label: 'Claimed' },
      { value: 'unclaimed', label: 'Unclaimed' }
    ];
    this.languages = [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish' },
      { value: 'fr', label: 'French' },
      { value: 'de', label: 'German' },
      { value: 'pt', label: 'Portuguese' }
    ];
  }

  loadPaymentLogs(): void {
    this.loading = true;

    const formattedFilters: PaymentLogFilters = {
      ...this.filters,
      searchDate: this.searchDate ? this.formatDate(this.searchDate) : ''
    };

    this.paymentLogService.getPaymentLogs(this.currentPage, this.itemsPerPage, formattedFilters)
      .subscribe({
        next: (response) => {
          this.paymentLogs = response.data;
          this.summary = response.summary;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
          this.totalItems = response.pagination.totalItems;
          this.itemsPerPage = response.pagination.itemsPerPage;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading payment logs:', error);
          this.loading = false;
        }
      });
  }

  formatDate(date: Date): string {
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPaymentLogs();
  }

  clearFilters(): void {
    this.filters = {
      searchByAppId: '',
      searchByAppIdOrTransaction: '',
      searchDate: '',
      subscriptionType: '',
      productId: '',
      subscriptionPeriod: '',
      addons: '',
      paymentMode: '',
      paymentSource: '',
      claimedUser: '',
      language: ''
    };
    this.searchDate = null;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.filters.searchByAppId !== '' ||
           this.filters.searchByAppIdOrTransaction !== '' ||
           this.searchDate !== null ||
           this.filters.subscriptionType !== '' ||
           this.filters.productId !== '' ||
           this.filters.subscriptionPeriod !== '' ||
           this.filters.addons !== '' ||
           this.filters.paymentMode !== '' ||
           this.filters.paymentSource !== '' ||
           this.filters.claimedUser !== '' ||
           this.filters.language !== '';
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadPaymentLogs();
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

  getPaymentModeClass(paymentMode: string): string {
    if (!paymentMode) return 'payment-mode-default';
    const mode = paymentMode.toLowerCase();
    if (mode === 'stripe') return 'payment-mode-stripe';
    if (mode === 'paypal') return 'payment-mode-paypal';
    if (mode === 'razorpay') return 'payment-mode-razorpay';
    return 'payment-mode-default';
  }

  getRefundStatusClass(status: string): string {
    if (!status) return 'refund-status-no';
    const s = status.toLowerCase();
    if (s === 'yes' || s === 'refunded') return 'refund-status-yes';
    return 'refund-status-no';
  }

  exportData(): void {
    const formattedFilters: PaymentLogFilters = {
      ...this.filters,
      searchDate: this.searchDate ? this.formatDate(this.searchDate) : ''
    };

    this.paymentLogService.exportPaymentLogs(formattedFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting payment logs:', error);
        alert('Error exporting payment logs');
      }
    });
  }

  viewInfo(log: PaymentLog): void {
    console.log('View info for:', log);
    // TODO: Implement info dialog
  }

  downloadInvoice(log: PaymentLog): void {
    this.paymentLogService.downloadInvoice(log.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${log.invoice_id || log.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading invoice:', error);
        alert('Error downloading invoice');
      }
    });
  }

  viewSignedAgreement(log: PaymentLog): void {
    console.log('View signed agreement for:', log);
    // TODO: Implement signed agreement view
  }

  claimPayment(log: PaymentLog): void {
    console.log('Claim payment:', log);
    // TODO: Implement claim payment dialog
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToSubscriptions(): void {
    this.router.navigate(['/subscriptions']);
  }

  goToPaymentLogs(): void {
    // Already on payment logs page
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
