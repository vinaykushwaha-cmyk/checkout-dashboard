import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentLog {
  id: number;
  app_id: string;
  app_name: string;
  email: string;
  message: string;
  payment_period: string;
  amount: string;
  currency: string;
  tax_amount: string;
  invoice_id: string;
  transaction_id: string;
  payment_mode: string;
  payment_source: string;
  device_selection: string;
  refund_status: string;
  ip_address: string;
  last_payment_date: string;
  claim_to: string;
  subscription_type: string;
  product_name: string;
  product_id: string;
  addon_name: string;
  language: string;
  claimed_user: string;
  has_invoice: boolean;
  has_signed_agreement: boolean;
}

export interface PaymentLogSummary {
  trial: {
    count: number;
    amount: number;
  };
  upgrade: {
    count: number;
    amount: number;
  };
  renewal: {
    count: number;
    amount: number;
  };
  total: {
    count: number;
    amount: number;
  };
}

export interface PaymentLogResponse {
  success: boolean;
  data: PaymentLog[];
  summary: PaymentLogSummary;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PaymentLogFilters {
  searchByAppId?: string;
  searchByAppIdOrTransaction?: string;
  searchDate?: string;
  subscriptionType?: string;
  productId?: string;
  subscriptionPeriod?: string;
  addons?: string;
  paymentMode?: string;
  paymentSource?: string;
  claimedUser?: string;
  language?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface Product {
  id: number;
  name: string;
}

export interface Addon {
  id: number;
  name: string;
  identifier?: string;
  productName?: string;
}

export interface Plan {
  id: number;
  name: string;
  identifier?: string;
  productName?: string;
}

export interface Currency {
  code: string;
  sign: string;
}

export interface CountryOption {
  value: string;
  label: string;
  currencyCode?: string;
  currencySign?: string;
}

export interface AllFiltersResponse {
  success: boolean;
  data: {
    products: Product[];
    plans: Plan[];
    addons: Addon[];
    subscriptionTypes: FilterOption[];
    paymentModes: FilterOption[];
    paymentSources: FilterOption[];
    subscriptionPeriods: FilterOption[];
    languages: CountryOption[];
    claimedUsers: FilterOption[];
    currencies: Currency[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentLogService {
  private apiUrl = 'http://localhost:3000/api/payment-logs';

  constructor(private http: HttpClient) {}

  getPaymentLogs(page: number = 1, limit: number = 10, filters?: PaymentLogFilters): Observable<PaymentLogResponse> {
    let params = `page=${page}&limit=${limit}`;

    if (filters) {
      if (filters.searchByAppId) params += `&searchByAppId=${encodeURIComponent(filters.searchByAppId)}`;
      if (filters.searchByAppIdOrTransaction) params += `&searchByAppIdOrTransaction=${encodeURIComponent(filters.searchByAppIdOrTransaction)}`;
      if (filters.searchDate) params += `&searchDate=${encodeURIComponent(filters.searchDate)}`;
      if (filters.subscriptionType) params += `&subscriptionType=${encodeURIComponent(filters.subscriptionType)}`;
      if (filters.productId) params += `&productId=${encodeURIComponent(filters.productId)}`;
      if (filters.subscriptionPeriod) params += `&subscriptionPeriod=${encodeURIComponent(filters.subscriptionPeriod)}`;
      if (filters.addons) params += `&addons=${encodeURIComponent(filters.addons)}`;
      if (filters.paymentMode) params += `&paymentMode=${encodeURIComponent(filters.paymentMode)}`;
      if (filters.paymentSource) params += `&paymentSource=${encodeURIComponent(filters.paymentSource)}`;
      if (filters.claimedUser) params += `&claimedUser=${encodeURIComponent(filters.claimedUser)}`;
      if (filters.language) params += `&language=${encodeURIComponent(filters.language)}`;
    }

    return this.http.get<PaymentLogResponse>(`${this.apiUrl}?${params}`);
  }

  getPaymentLogById(id: number): Observable<{ success: boolean; data: PaymentLog }> {
    return this.http.get<{ success: boolean; data: PaymentLog }>(`${this.apiUrl}/${id}`);
  }

  // Get all filter options in a single call
  getAllFilters(): Observable<AllFiltersResponse> {
    return this.http.get<AllFiltersResponse>(`${this.apiUrl}/filters/all`);
  }

  getProducts(): Observable<{ success: boolean; data: Product[] }> {
    return this.http.get<{ success: boolean; data: Product[] }>(`${this.apiUrl}/products/list`);
  }

  getAddons(): Observable<{ success: boolean; data: Addon[] }> {
    return this.http.get<{ success: boolean; data: Addon[] }>(`${this.apiUrl}/addons/list`);
  }

  getSubscriptionTypes(): Observable<{ success: boolean; data: FilterOption[] }> {
    return this.http.get<{ success: boolean; data: FilterOption[] }>(`${this.apiUrl}/subscription-types/list`);
  }

  getPaymentModes(): Observable<{ success: boolean; data: FilterOption[] }> {
    return this.http.get<{ success: boolean; data: FilterOption[] }>(`${this.apiUrl}/payment-modes/list`);
  }

  getPaymentSources(): Observable<{ success: boolean; data: FilterOption[] }> {
    return this.http.get<{ success: boolean; data: FilterOption[] }>(`${this.apiUrl}/payment-sources/list`);
  }

  getSubscriptionPeriods(): Observable<{ success: boolean; data: FilterOption[] }> {
    return this.http.get<{ success: boolean; data: FilterOption[] }>(`${this.apiUrl}/subscription-periods/list`);
  }

  getLanguages(): Observable<{ success: boolean; data: FilterOption[] }> {
    return this.http.get<{ success: boolean; data: FilterOption[] }>(`${this.apiUrl}/languages/list`);
  }

  getClaimedUsers(): Observable<{ success: boolean; data: FilterOption[] }> {
    return this.http.get<{ success: boolean; data: FilterOption[] }>(`${this.apiUrl}/claimed-users/list`);
  }

  exportPaymentLogs(filters?: PaymentLogFilters): Observable<Blob> {
    let params = '';

    if (filters) {
      const filterParams: string[] = [];
      if (filters.searchByAppId) filterParams.push(`searchByAppId=${encodeURIComponent(filters.searchByAppId)}`);
      if (filters.searchByAppIdOrTransaction) filterParams.push(`searchByAppIdOrTransaction=${encodeURIComponent(filters.searchByAppIdOrTransaction)}`);
      if (filters.searchDate) filterParams.push(`searchDate=${encodeURIComponent(filters.searchDate)}`);
      if (filters.subscriptionType) filterParams.push(`subscriptionType=${encodeURIComponent(filters.subscriptionType)}`);
      if (filters.productId) filterParams.push(`productId=${encodeURIComponent(filters.productId)}`);
      if (filters.subscriptionPeriod) filterParams.push(`subscriptionPeriod=${encodeURIComponent(filters.subscriptionPeriod)}`);
      if (filters.addons) filterParams.push(`addons=${encodeURIComponent(filters.addons)}`);
      if (filters.paymentMode) filterParams.push(`paymentMode=${encodeURIComponent(filters.paymentMode)}`);
      if (filters.paymentSource) filterParams.push(`paymentSource=${encodeURIComponent(filters.paymentSource)}`);
      if (filters.claimedUser) filterParams.push(`claimedUser=${encodeURIComponent(filters.claimedUser)}`);
      if (filters.language) filterParams.push(`language=${encodeURIComponent(filters.language)}`);
      if (filterParams.length > 0) params = '?' + filterParams.join('&');
    }

    return this.http.get(`${this.apiUrl}/export${params}`, { responseType: 'blob' });
  }

  downloadInvoice(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/invoice/${paymentId}`, { responseType: 'blob' });
  }
}
