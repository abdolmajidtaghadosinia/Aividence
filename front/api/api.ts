import axios, { AxiosResponse, AxiosError } from "axios";
import type { DictionaryTerm, DashboardResponse } from "../types";

// آدرس پایه API از متغیر محیطی Vite خوانده می‌شود
// اگر تنظیم نشده بود، از origin فعلی استفاده می‌کنیم
const envBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
// اگر روی لوکال اجرا می‌شود (localhost یا 127.0.0.1)، همیشه از همان origin مرورگر استفاده می‌کنیم
// تا به صورت ناخواسته به دامنه تولیدی هدایت نشود و صفحات در حالت بارگذاری نمانند.
const isLocalhost = typeof window !== 'undefined'
    && ['localhost', '127.0.0.1'].includes(window.location.hostname);

// منطق جدید: اگر مقدار محیطی بدون پروتکل باشد، همان پروتکل صفحه فعلی را استفاده می‌کنیم
// تا درخواست‌ها روی HTTP/HTTPS یکسان ارسال شوند و با خطای 405 در nginx مواجه نشویم.
const normalizeBase = (raw?: string) => {
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${raw}`;
    }
    return `http://${raw}`;
};

const normalizedEnvBase = normalizeBase(envBase);
const BASE_URL = !isLocalhost && normalizedEnvBase && normalizedEnvBase.length > 0
    ? normalizedEnvBase
    : (typeof window !== 'undefined' ? window.location.origin : undefined);
export { BASE_URL };

interface IApiResponse {
    status: boolean;
    message: string;
}

interface ILoginResponse {
    refresh: string;
    access: string;
}

interface ILoginRequest {
    email: string;
    password: string;
}

interface IRefreshTokenResponse {
    access: string;
}

interface IUserInfoResponse {
    id: number;
    name?: string;
    full_name?: string;
    email: string;
    role?: string;
    user_type?: string;
    employee_id?: string;
    department?: string;
}

interface IErrorResponse {
    response?: {
        status?: number;
        statusText?: string;
        data: {
            data?: string;
            message?: string;
            detail?: string;
        };
    };
    message?: string;
    config?: any;
}

// توابع کمکی برای مدیریت توکن و ری‌دایرکت
const clearAuthTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('guest_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('token');
    localStorage.removeItem('id_token');
};

const redirectToLogin = () => {
    // HashRouter-friendly redirect without hitting server
    if (window.location.hash !== '#/login') {
        window.location.replace('/#/login');
    }
};

// تنظیمات پیش‌فرض Axios
axios.defaults.baseURL = BASE_URL;
delete axios.defaults.headers.common['Accept'];
delete axios.defaults.headers.common['Content-Type'];

// Interceptors
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("guest_token");
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // برای FormData، هدر Content-Type را حذف می‌کنیم تا axios به صورت خودکار تنظیم کند
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (config.method !== 'get' && config.data) {
            config.headers['Content-Type'] = 'application/json';
        }
        return config;
    },
    (error: IErrorResponse) => Promise.reject(error)
);

axios.interceptors.response.use(
    (response) => response,
    async (error: IErrorResponse) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshTokenValue = localStorage.getItem('refresh_token');
            if (refreshTokenValue) {
                try {
                    const response = await refreshToken(refreshTokenValue);
                    localStorage.setItem('access_token', response.access);
                    originalRequest.headers['Authorization'] = `Bearer ${response.access}`;
                    return axios(originalRequest);
                } catch (refreshError) {
                    clearAuthTokens();
                    redirectToLogin();
                    return Promise.reject(refreshError);
                }
            } else {
                clearAuthTokens();
                redirectToLogin();
            }
        }

        return Promise.reject(error);
    }
);

// کلاس اصلی API
class ApiService {
    private async request<T>(method: string, url: string, data: any = {}, params: any = {}, responseType?: 'json' | 'blob'): Promise<T> {
        try {
            const response: AxiosResponse<T> = await axios({
                method,
                url,
                data,
                params,
                responseType: responseType as any,
            });
            return response.data;
        } catch (error: any) {
            const err: IErrorResponse = error;

            const code = err?.response?.data?.data;
            if (code === "inactive" || code === "logout" || code === "ipBlock") {
                clearAuthTokens();
                setTimeout(() => redirectToLogin(), 500);
            }

            const errorMessage =
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.response?.data ||
                err.message ||
                'خطای نامشخص';

            throw {
                message: errorMessage,
                status: err.response?.status,
                data: err.response?.data
            };
        }
    }

    get<T = IApiResponse>(url: string, params: any = {}): Promise<T> {
        return this.request<T>('get', url, {}, params);
    }

    post<T = IApiResponse>(url: string, data: any = {}): Promise<T> {
        return this.request<T>('post', url, data);
    }

    put<T = IApiResponse>(url: string, data: any = {}): Promise<T> {
        return this.request<T>('put', url, data);
    }

    delete<T = IApiResponse>(url: string, data: any = {}): Promise<T> {
        return this.request<T>('delete', url, data);
    }

    // متد جدید برای ارسال FormData
    postFormData<T = IApiResponse>(url: string, formData: FormData): Promise<T> {
        return new Promise((resolve, reject) => {
            const token = localStorage.getItem("access_token") || localStorage.getItem("guest_token");
            
            const config = {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : undefined,
                    'Content-Type': 'multipart/form-data',
                }
            };

            axios.post(url, formData, config)
                .then((response: AxiosResponse) => resolve(response.data))
                .catch((error: IErrorResponse) => {
                    const code = error?.response?.data?.data;
                    if (code === "inactive" || code === "logout" || code === "ipBlock") {
                        clearAuthTokens();
                        setTimeout(() => redirectToLogin(), 500);
                    }

                    const errorMessage =
                        error.response?.data?.message ||
                        error.response?.data?.detail ||
                        error.response?.data ||
                        error.message ||
                        'خطای نامشخص';

                    reject({
                        message: errorMessage,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                });
        });
    }

    // post که خروجی blob دارد (برای دانلود فایل)
    postBlob(url: string, data: any = {}): Promise<Blob> {
        return this.request<Blob>('post', url, data, {}, 'blob');
    }
}

const Api = new ApiService();
export default Api;

// -----------------------------
// Authentication APIs
// -----------------------------
export const loginUser = async (credentials: ILoginRequest): Promise<ILoginResponse> => {
    return Api.post<ILoginResponse>('/api/v1/accounts/login/', credentials);
};

export const refreshToken = async (refreshToken: string): Promise<IRefreshTokenResponse> => {
    return Api.post<IRefreshTokenResponse>('/api/v1/accounts/token/refresh/', { refresh: refreshToken });
};

export const getUserInfo = async (): Promise<IUserInfoResponse> => {
    return Api.get<IUserInfoResponse>('/api/v1/accounts/user-info/');
};

// -----------------------------
// Dictionary APIs
// -----------------------------
export const getDictionaryTerms = async (): Promise<DictionaryTerm[]> => {
    return Api.get<DictionaryTerm[]>('/api/v1/office/keyword/');
};

export const updateDictionaryTerm = async (id: number, description: string): Promise<DictionaryTerm> => {
    return Api.put<DictionaryTerm>(`/api/v1/office/keyword/${id}/`, { description });
};

export const createDictionaryTerm = async (newTermData: DictionaryTerm): Promise<DictionaryTerm> => {
    return Api.post<DictionaryTerm>('/api/v1/office/keyword/', newTermData);
};

// -----------------------------
// Upload Form Data APIs
// -----------------------------
export interface UploadFormData {
    file_type_choices: { [key: string]: string };
    subsets: Array<{ id: number; title: string }>;
}

export const getUploadFormData = async (): Promise<UploadFormData> => {
    return Api.get<UploadFormData>('/api/v1/files/audio/upload/');
};

export const submitUploadForm = async (formData: FormData): Promise<any> => {
    try {
        const response = await Api.postFormData<any>('/api/v1/files/audio/upload/', formData);
        return response;
    } catch (error: any) {
        console.error('Error submitting upload form:', error);
        throw error;
    }
};

// -----------------------------
// Dashboard APIs
// -----------------------------
export const getDashboardData = async (): Promise<DashboardResponse> => {
    return Api.get<DashboardResponse>('/api/v1/main/dashboard/');
};

// -----------------------------
// File Status APIs
// -----------------------------
export interface FileStatusResponse {
    success: boolean;
    audio_id: number;
    file_name: string;
    current_status: string;
    status_display: string;
    has_text_record: boolean;
    is_processing: boolean;
    is_completed: boolean;
    is_rejected: boolean;
}

export interface TaskProgressResponse {
    success: boolean;
    task_id: string;
    state: string;
    progress: number | string;
    status: string;
    is_completed: boolean;
    is_failed: boolean;
}

export const checkFileStatus = async (audioId: number): Promise<FileStatusResponse> => {
    return Api.get<FileStatusResponse>(`/api/v1/files/audio/${audioId}/status/`);
};

export const getTaskProgress = async (taskId: string): Promise<TaskProgressResponse> => {
    return Api.get<TaskProgressResponse>(`/api/v1/files/task/${taskId}/progress/`);
};

// -----------------------------
// Review (Audio Text) APIs
// -----------------------------
export interface AudioTextGetResponse {
    success: boolean;
    audio_id: number;
    file_name: string;
    status: string;
    original_text: string;
    processed_text?: string;
    custom_text: string;
    has_custom_text: boolean;
    created_at: string;
    updated_at: string;
}

export const getAudioTextByUuid = async (uuid: string): Promise<AudioTextGetResponse> => {
    return Api.get<AudioTextGetResponse>(`/api/v1/files/audio/${uuid}/text/`);
};

// -----------------------------
// Reprocess Audio APIs
// -----------------------------
export const reprocessAudio = async (uuid: string): Promise<{ success: boolean; task_id?: string; audio_id?: number; message?: string; }> => {
    return Api.post(`/api/v1/files/audio/${uuid}/reprocess/`);
};

// -----------------------------
// Office: Export custom content ZIP
// -----------------------------
export const exportCustomContentZip = async (audioId: number): Promise<void> => {
    const blob = await Api.postBlob('/api/v1/office/export-custom-zip/', { audio_id: audioId });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom_content_${audioId}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

// -----------------------------
// Update audio status (approve)
// -----------------------------
export const updateAudioStatus = async (audioId: number, status: 'AP' | 'P' | 'PD' | 'A' | 'R' | 'E') => {
    return Api.put(`/api/v1/files/audio/${audioId}/status/`, { status });
};