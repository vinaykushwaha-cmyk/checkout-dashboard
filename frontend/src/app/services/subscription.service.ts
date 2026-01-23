import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Subscription {
  id: number;
  product_name: string;
  product_id: string;
  user_id: string;
  subscription_period: string;
  subscription_id: string;
  subscription_start_date: string;
  subscription_end_date: string;
  plan_price: string;
  currency: string;
  plan_id: number;
  plan_name: string;
  status: string;
  payment_method: string;
}

export interface SubscriptionResponse {
  success: boolean;
  data: Subscription[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface Plan {
  id: number;
  plan_name: string;
}

export interface PlanResponse {
  success: boolean;
  data: Plan[];
}

export interface Product {
  id: number;
  name: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = 'http://localhost:3000/api/subscriptions';

  constructor(private http: HttpClient) {}

  getSubscriptions(page: number = 1, limit: number = 10, filters?: any): Observable<SubscriptionResponse> {
    let params = `page=${page}&limit=${limit}`;

    if (filters) {
      if (filters.productName) params += `&productName=${encodeURIComponent(filters.productName)}`;
      if (filters.productId) params += `&productId=${encodeURIComponent(filters.productId)}`;
      if (filters.planName) params += `&planName=${encodeURIComponent(filters.planName)}`;
      if (filters.period) params += `&period=${encodeURIComponent(filters.period)}`;
      if (filters.startDate) params += `&startDate=${encodeURIComponent(filters.startDate)}`;
      if (filters.renewalDate) params += `&renewalDate=${encodeURIComponent(filters.renewalDate)}`;
    }

    return this.http.get<SubscriptionResponse>(`${this.apiUrl}?${params}`);
  }

  getSubscriptionById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getPlans(productName?: string): Observable<PlanResponse> {
    let url = `${this.apiUrl}/plans/list`;
    if (productName) {
      url += `?productName=${encodeURIComponent(productName)}`;
    }
    return this.http.get<PlanResponse>(url);
  }

  getProducts(): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/products/list`);
  }

  cancelSubscription(data: {
    subscriptionId: number;
    productId: string;
    userId: string;
    productName: string;
    comment: string;
    cancelledType: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancel`, data);
  }

  renewalCharge(data: {
    subscriptionId: number;
    productId: string;
    userId: string;
    productName: string;
    comment: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/renewal-charge`, data);
  }

  updateEndDate(data: {
    subscriptionId: number;
    productId: string;
    newEndDate: string;
    comment: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-end-date`, data);
  }
}
