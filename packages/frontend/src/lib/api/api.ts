import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { MomentService } from '@/lib/api/modules/moment/moment.service';
import { RelationshipService } from '@/lib/api/modules/relationship/relationship.service';
import { UserService } from '@/lib/api/modules/user/user.service';
import { auth } from '../better-auth/auth-client';
import { logger } from '../logger';

export const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
	_retryCount?: number;
}

export class ApiClient {
	private static instance: ApiClient;
	private axiosInstance: AxiosInstance;
	private isRefreshing = false;
	private failedQueue: Array<{
		resolve: (token: string) => void;
		reject: (error: unknown) => void;
	}> = [];

	private readonly maxRetries = 3;

	private constructor() {
		this.axiosInstance = axios.create({
			baseURL: API_URL,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		this.setupInterceptors();
	}

	users = new UserService(this);
	relationships = new RelationshipService(this);
	moments = new MomentService(this);

	public static getInstance(): ApiClient {
		if (!ApiClient.instance) {
			ApiClient.instance = new ApiClient();
		}
		return ApiClient.instance;
	}

	private getStoredToken(): string | null {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem('auth-jwt');
	}

	private setStoredToken(token: string): void {
		if (typeof window === 'undefined') return;
		localStorage.setItem('auth-jwt', token);
	}

	private async fetchAccessToken(): Promise<string | null> {
		try {
			logger.debug('Fetching new access token...');
			const session = await auth.getSession();

			if (session.error || !session.data) {
				logger.debug('User is not authenticated! Could not set an access token.');
				return null;
			}

			const response = await axios.get<{ token: string }>('/api/auth/token', {
				headers: {
					Authorization: `Bearer ${session.data.session.token}`,
				},
			});

			logger.debug('Fetched new auth token!');
			this.setStoredToken(response.data.token);
			return response.data.token;
		} catch (error) {
			logger.error('Failed to fetch access token:', error);
			return null;
		}
	}

	private processQueue(error: unknown, token: string | null = null): void {
		this.failedQueue.forEach(({ resolve, reject }) => {
			if (error) {
				reject(error);
			} else {
				resolve(token!);
			}
		});

		this.failedQueue = [];
	}

	private setupInterceptors(): void {
		// Request interceptor to add auth token
		this.axiosInstance.interceptors.request.use(
			(config: ExtendedAxiosRequestConfig) => {
				const token = this.getStoredToken();
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			error => Promise.reject(error),
		);

		// Response interceptor to handle token refresh and retries
		this.axiosInstance.interceptors.response.use(
			response => response,
			async (error: AxiosError) => {
				const originalRequest = error.config as ExtendedAxiosRequestConfig;

				if (!originalRequest) {
					return Promise.reject(error);
				}

				// Handle 401 errors (token expired/invalid)
				if (error.response?.status === 401 && !originalRequest._retry) {
					if (this.isRefreshing) {
						// If already refreshing, queue the request
						return new Promise((resolve, reject) => {
							this.failedQueue.push({
								resolve: (token: string) => {
									originalRequest.headers.Authorization = `Bearer ${token}`;
									resolve(this.axiosInstance(originalRequest));
								},
								reject,
							});
						});
					}

					originalRequest._retry = true;
					this.isRefreshing = true;

					try {
						const newToken = await this.fetchAccessToken();

						if (newToken) {
							originalRequest.headers.Authorization = `Bearer ${newToken}`;
							this.processQueue(null, newToken);
							return this.axiosInstance(originalRequest);
						} else {
							this.processQueue(error, null);
							return Promise.reject(error);
						}
					} catch (refreshError) {
						this.processQueue(refreshError, null);
						return Promise.reject(refreshError);
					} finally {
						this.isRefreshing = false;
					}
				}

				// Handle retry logic for network errors or 5xx errors
				if (this.shouldRetry(error, originalRequest)) {
					originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
					const delay = 2 ** originalRequest._retryCount * 1000; // Exponential backoff

					logger.debug(`Retrying request (${originalRequest._retryCount}/${this.maxRetries}) after ${delay}ms`);

					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(this.axiosInstance(originalRequest));
						}, delay);
					});
				}

				return Promise.reject(error);
			},
		);
	}

	private shouldRetry(error: AxiosError, config: ExtendedAxiosRequestConfig): boolean {
		const retryCount = config._retryCount || 0;
		if (retryCount >= this.maxRetries) return false;

		// Retry on network errors
		if (!error.response) return true;

		// Retry on 5xx server errors
		if (error.response.status >= 500) return true;

		// Retry on specific 4xx errors (rate limiting, etc.)
		if (error.response.status === 429) return true;

		return false;
	}

	async get<T>(endpoint: string): Promise<T> {
		const response = await this.axiosInstance.get<T>(endpoint);
		return response.data;
	}

	async post<T>(endpoint: string, data: unknown): Promise<T> {
		const response = await this.axiosInstance.post<T>(endpoint, data);
		return response.data;
	}

	async put<T>(endpoint: string, data: unknown): Promise<T> {
		const response = await this.axiosInstance.put<T>(endpoint, data);
		return response.data;
	}

	async patch<T>(endpoint: string, data: unknown): Promise<T> {
		const response = await this.axiosInstance.patch<T>(endpoint, data);
		return response.data;
	}

	async delete<T>(endpoint: string): Promise<T> {
		const response = await this.axiosInstance.delete<T>(endpoint);
		return response.data;
	}
}

export const apiClient = ApiClient.getInstance();
