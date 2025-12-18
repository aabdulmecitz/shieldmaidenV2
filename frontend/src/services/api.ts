// API Configuration and HTTP Client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

// Token management
const getToken = (): string | null => localStorage.getItem('token');
const setToken = (token: string): void => localStorage.setItem('token', token);
const removeToken = (): void => localStorage.removeItem('token');

// Base fetch function
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = getToken();

    const headers: HeadersInit = {
        ...options.headers,
    };

    // Add auth header if token exists
    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Add content type for non-FormData requests
    if (!(options.body instanceof FormData)) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    // Handle 401 - redirect to login
    if (response.status === 401) {
        removeToken();
        window.location.href = '/login';
        throw new Error('Session expired');
    }

    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }

    return data;
}

// Auth API
export const authApi = {
    register: async (userData: {
        username: string;
        email: string;
        password: string;
    }) => {
        const response = await apiFetch<{ user: User }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return response.data;
    },

    login: async (credentials: { email: string; password: string }) => {
        const response = await apiFetch<{ token: string; user: User }>(
            '/auth/login',
            {
                method: 'POST',
                body: JSON.stringify(credentials),
            }
        );
        if (response.data?.token) {
            setToken(response.data.token);
        }
        return response.data;
    },

    logout: () => {
        removeToken();
        window.location.href = '/login';
    },

    getProfile: async () => {
        const response = await apiFetch<{ user: User }>('/auth/profile');
        return response.data;
    },
};

// Files API
export const filesApi = {
    upload: async (
        file: File,
        options: {
            expiresIn?: number;
            downloadLimit?: number;
            accessType?: string;
            password?: string;
        } = {}
    ) => {
        const formData = new FormData();
        formData.append('file', file);
        if (options.expiresIn) formData.append('expiresIn', String(options.expiresIn));
        if (options.downloadLimit) formData.append('downloadLimit', String(options.downloadLimit));
        if (options.accessType) formData.append('accessType', options.accessType);
        if (options.password) formData.append('password', options.password);

        const response = await apiFetch<{
            file: FileInfo;
            shareLink: ShareLinkInfo;
        }>('/files/upload', {
            method: 'POST',
            body: formData,
        });
        return response.data;
    },

    getMyFiles: async () => {
        const response = await apiFetch<{ files: FileInfo[]; count: number }>(
            '/files/my-files'
        );
        return response.data;
    },

    getFileDetails: async (id: string) => {
        const response = await apiFetch<{ file: FileInfo; shareLinks: ShareLinkInfo[] }>(
            `/files/${id}`
        );
        return response.data;
    },

    deleteFile: async (id: string) => {
        await apiFetch(`/files/${id}`, { method: 'DELETE' });
    },

    createShareLink: async (fileId: string, options: ShareLinkOptions = {}) => {
        const response = await apiFetch<{ shareLink: ShareLinkInfo }>(
            `/files/${fileId}/share`,
            {
                method: 'POST',
                body: JSON.stringify(options),
            }
        );
        return response.data;
    },

    getFileInfo: async (token: string) => {
        const response = await apiFetch<{
            file: { name: string; size: number; sizeFormatted: string; mimetype: string };
            shareLink: {
                expiresAt: string;
                expiresIn: string;
                downloadLimit: number;
                downloadCount: number;
                remainingDownloads: number;
                isPasswordProtected: boolean;
                customMessage?: string;
            };
        }>(`/files/info/${token}`);
        return response.data;
    },

    getDownloadUrl: (token: string, password?: string) => {
        const base = `${API_BASE_URL}/api/files/download/${token}`;
        return password ? `${base}?password=${encodeURIComponent(password)}` : base;
    },
};

// Share Links API
export const shareLinksApi = {
    getMyLinks: async (activeOnly = false) => {
        const response = await apiFetch<{ shareLinks: ShareLinkInfo[]; count: number }>(
            `/share/my-links?activeOnly=${activeOnly}`
        );
        return response.data;
    },

    updateLink: async (id: string, updates: Partial<ShareLinkOptions>) => {
        const response = await apiFetch<{ shareLink: ShareLinkInfo }>(
            `/share/${id}`,
            {
                method: 'PUT',
                body: JSON.stringify(updates),
            }
        );
        return response.data;
    },

    deactivateLink: async (id: string) => {
        await apiFetch(`/share/${id}`, { method: 'DELETE' });
    },
};

// Dashboard API
export const dashboardApi = {
    getUserDashboard: async () => {
        const response = await apiFetch<DashboardData>('/dashboard/user');
        return response.data;
    },

    getMetrics: async (days = 30) => {
        const response = await apiFetch<MetricsData>(`/dashboard/metrics?days=${days}`);
        return response.data;
    },

    getDownloadHistory: async (limit = 50, skip = 0) => {
        const response = await apiFetch<{ logs: DownloadLog[]; total: number }>(
            `/dashboard/downloads?limit=${limit}&skip=${skip}`
        );
        return response.data;
    },
};

// Types
export interface User {
    _id: string;
    username: string;
    email: string;
    displayName?: string;
    role: 'user' | 'admin';
    storageUsed: number;
    storageQuota: number;
    storagePercentage: number;
    stats: {
        totalFilesUploaded: number;
        totalDownloads: number;
        totalShareLinks: number;
    };
}

export interface FileInfo {
    _id: string;
    originalName: string;
    size: number;
    sizeFormatted: string;
    mimetype: string;
    createdAt: string;
    shareLinkCount?: number;
    activeShareLinks?: number;
}

export interface ShareLinkInfo {
    _id: string;
    token: string;
    url: string;
    accessType: 'single' | 'multiple' | 'unlimited';
    downloadLimit: number;
    downloadCount: number;
    expiresAt: string;
    isActive: boolean;
    isPasswordProtected: boolean;
    customMessage?: string;
}

export interface ShareLinkOptions {
    accessType?: 'single' | 'multiple' | 'unlimited';
    downloadLimit?: number;
    expiresIn?: number;
    password?: string;
    customMessage?: string;
}

export interface DashboardData {
    user: {
        id: string;
        username: string;
        storageUsed: number;
        storageQuota: number;
        storagePercentage: number;
    };
    files: {
        total: number;
        uploaded: number;
    };
    shareLinks: {
        totalLinks: number;
        activeLinks: number;
        totalDownloads: number;
    };
    downloads: {
        totalDownloads: number;
        successfulDownloads: number;
        failedDownloads: number;
    };
    activity: {
        period: string;
        uploads: number;
        downloads: number;
        shareLinksCreated: number;
    };
}

export interface MetricsData {
    downloads: { date: string; count: number; successCount: number }[];
    uploads: { date: string; count: number; totalSize: number }[];
}

export interface DownloadLog {
    _id: string;
    fileId: { originalName: string; size: number };
    downloadedAt: string;
    success: boolean;
    ipAddress: string;
}

export { getToken, setToken, removeToken };
