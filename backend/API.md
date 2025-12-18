# ShieldMaiden API Documentation for Frontend Integration

## Base Configuration

```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5001';
const API_PREFIX = '/api';
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

## API Endpoints

### 1. Authentication

#### 1.1 Register User
```javascript
POST /api/auth/register

Request Body:
{
  "username": "johndoe",          // Required, 3-30 chars, alphanumeric + underscore
  "email": "john@example.com",    // Required, valid email
  "password": "password123",      // Required, min 6 chars
  "displayName": "John Doe"       // Optional, max 50 chars
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "role": "user",
      "storageUsed": 0,
      "storageQuota": 1073741824
    }
  }
}
```

#### 1.2 Login
```javascript
POST /api/auth/login

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

#### 1.3 Get Profile
```javascript
GET /api/auth/profile
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "role": "user",
      "storageUsed": 1048576,
      "storageQuota": 1073741824,
      "storagePercentage": 0.1,
      "stats": {
        "totalFilesUploaded": 5,
        "totalDownloads": 20,
        "totalShareLinks": 8
      }
    }
  }
}
```

---

### 2. File Management

#### 2.1 Upload File
```javascript
POST /api/files/upload
Headers: 
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Form Data:
  file: <File>                    // Required
  expiresIn: 24                   // Optional, hours (1-8760), default: 24
  downloadLimit: 10               // Optional, (1-1000), default: 10
  accessType: "multiple"          // Optional, "single"|"multiple"|"unlimited"
  password: "secret123"           // Optional, min 4 chars

Response (201):
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "id": "...",
      "name": "document.pdf",
      "size": 1048576,
      "sizeFormatted": "1 MB",
      "mimetype": "application/pdf",
      "uploadedAt": "2025-12-17T02:00:00.000Z"
    },
    "shareLink": {
      "id": "...",
      "token": "abc123...",
      "url": "http://localhost:5173/share/abc123...",
      "expiresAt": "2025-12-18T02:00:00.000Z",
      "downloadLimit": 10,
      "accessType": "multiple"
    }
  }
}
```

#### 2.2 Get My Files
```javascript
GET /api/files/my-files?limit=50&skip=0
Headers: Authorization: Bearer <token>

Query Parameters:
  limit: number (default: 50, max: 100)
  skip: number (default: 0)
  sort: JSON string (default: {"createdAt": -1})

Response (200):
{
  "success": true,
  "message": "Files retrieved",
  "data": {
    "files": [
      {
        "_id": "...",
        "originalName": "document.pdf",
        "size": 1048576,
        "sizeFormatted": "1 MB",
        "mimetype": "application/pdf",
        "createdAt": "2025-12-17T02:00:00.000Z",
        "shareLinkCount": 2,
        "activeShareLinks": 1
      }
    ],
    "count": 1
  }
}
```

#### 2.3 Get File Details
```javascript
GET /api/files/:id
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "File details retrieved",
  "data": {
    "file": { ... },
    "shareLinks": [ ... ]
  }
}
```

#### 2.4 Delete File
```javascript
DELETE /api/files/:id
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "File deleted successfully",
  "data": null
}
```

---

### 3. Share Links

#### 3.1 Create Share Link
```javascript
POST /api/files/:fileId/share
Headers: 
  Authorization: Bearer <token>
  Content-Type: application/json

Request Body:
{
  "accessType": "multiple",           // "single"|"multiple"|"unlimited"
  "downloadLimit": 10,                // 1-1000
  "expiresIn": 24,                    // hours, 1-8760
  "password": "secret123",            // Optional, min 4 chars
  "customMessage": "Here's the file", // Optional, max 500 chars
  "allowedIPs": ["192.168.1.1"],     // Optional, array of IPs
  "allowedEmails": ["user@ex.com"],  // Optional, array of emails
  "requiresAuth": false,              // Optional, boolean
  "notifyOnDownload": true            // Optional, boolean
}

Response (201):
{
  "success": true,
  "message": "Share link created",
  "data": {
    "shareLink": {
      "id": "...",
      "token": "abc123...",
      "url": "http://localhost:5173/share/abc123...",
      "expiresAt": "2025-12-18T02:00:00.000Z",
      "downloadLimit": 10,
      "accessType": "multiple",
      "isPasswordProtected": true
    }
  }
}
```

#### 3.2 Get File's Share Links
```javascript
GET /api/files/:fileId/shares
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Share links retrieved",
  "data": {
    "shareLinks": [ ... ],
    "count": 2
  }
}
```

#### 3.3 Get My Share Links
```javascript
GET /api/share/my-links?activeOnly=true
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Share links retrieved",
  "data": {
    "shareLinks": [ ... ],
    "count": 5
  }
}
```

#### 3.4 Update Share Link
```javascript
PUT /api/share/:id
Headers: 
  Authorization: Bearer <token>
  Content-Type: application/json

Request Body:
{
  "downloadLimit": 20,
  "customMessage": "Updated message"
}

Response (200):
{
  "success": true,
  "message": "Share link updated",
  "data": {
    "shareLink": { ... }
  }
}
```

#### 3.5 Deactivate Share Link
```javascript
DELETE /api/share/:id
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Share link deactivated",
  "data": null
}
```

---

### 4. Download (Public)

#### 4.1 Get File Info
```javascript
GET /api/files/info/:token

Response (200):
{
  "success": true,
  "message": "File info retrieved",
  "data": {
    "file": {
      "name": "document.pdf",
      "size": 1048576,
      "sizeFormatted": "1 MB",
      "mimetype": "application/pdf"
    },
    "shareLink": {
      "expiresAt": "2025-12-18T02:00:00.000Z",
      "expiresIn": "23 hours 45 minutes",
      "downloadLimit": 10,
      "downloadCount": 3,
      "remainingDownloads": 7,
      "isPasswordProtected": true,
      "customMessage": "Here's your file!"
    }
  }
}
```

#### 4.2 Download File
```javascript
GET /api/files/download/:token?password=secret123

// If password protected, include password in query
// Response is binary file stream with headers:
// Content-Disposition: attachment; filename="document.pdf"
// Content-Type: application/pdf
```

---

### 5. Dashboard

#### 5.1 User Dashboard
```javascript
GET /api/dashboard/user
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "user": {
      "id": "...",
      "username": "johndoe",
      "storageUsed": 5242880,
      "storageQuota": 1073741824,
      "storagePercentage": 0.49
    },
    "files": {
      "total": 5,
      "uploaded": 5
    },
    "shareLinks": {
      "totalLinks": 8,
      "activeLinks": 5,
      "totalDownloads": 42
    },
    "downloads": {
      "totalDownloads": 42,
      "successfulDownloads": 40,
      "failedDownloads": 2
    },
    "recent": {
      "files": [ ... ],
      "downloads": [ ... ]
    },
    "activity": {
      "period": "Last 30 days",
      "uploads": 5,
      "downloads": 42,
      "shareLinksCreated": 8
    }
  }
}
```

#### 5.2 Admin Dashboard
```javascript
GET /api/dashboard/admin
Headers: Authorization: Bearer <token>
Role: admin

Response (200):
{
  "success": true,
  "message": "Admin dashboard data retrieved",
  "data": {
    "system": {
      "users": { total: 100, active: 95 },
      "files": { total: 500, totalSize: 5368709120 },
      "shareLinks": { total: 800, active: 600 },
      "downloads": { ... }
    },
    "topFiles": [ ... ]
  }
}
```

#### 5.3 Get Metrics
```javascript
GET /api/dashboard/metrics?days=30
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Metrics retrieved",
  "data": {
    "downloads": [
      { "date": "2025-12-01", "count": 10, "successCount": 9 },
      { "date": "2025-12-02", "count": 15, "successCount": 14 }
    ],
    "uploads": [
      { "date": "2025-12-01", "count": 3, "totalSize": 3145728 },
      { "date": "2025-12-02", "count": 5, "totalSize": 5242880 }
    ]
  }
}
```

#### 5.4 Get Download History
```javascript
GET /api/dashboard/downloads?limit=50&skip=0
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Download history retrieved",
  "data": {
    "logs": [
      {
        "_id": "...",
        "fileId": { "originalName": "document.pdf", "size": 1048576 },
        "downloadedBy": { "username": "johndoe", "email": "john@ex.com" },
        "shareLinkId": { "token": "abc123", "accessType": "multiple" },
        "downloadedAt": "2025-12-17T02:00:00.000Z",
        "success": true,
        "ipAddress": "192.168.1.1"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

---

### 6. Admin Operations

#### 6.1 Get All Users
```javascript
GET /api/admin/users?limit=50&skip=0&search=john
Headers: Authorization: Bearer <token>
Role: admin

Response (200):
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "users": [ ... ],
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

#### 6.2 Get All Files
```javascript
GET /api/admin/files?limit=50&skip=0
Headers: Authorization: Bearer <token>
Role: admin

Response (200):
{
  "success": true,
  "message": "Files retrieved",
  "data": {
    "files": [ ... ],
    "total": 500,
    "page": 1,
    "limit": 50
  }
}
```

#### 6.3 Delete User
```javascript
DELETE /api/admin/users/:id
Headers: Authorization: Bearer <token>
Role: admin

Response (200):
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

#### 6.4 Update User Role
```javascript
PUT /api/admin/users/:id/role
Headers: 
  Authorization: Bearer <token>
  Content-Type: application/json
Role: admin

Request Body:
{
  "role": "admin"  // "user" or "admin"
}

Response (200):
{
  "success": true,
  "message": "User role updated",
  "data": {
    "user": { ... }
  }
}
```

#### 6.5 Get System Health
```javascript
GET /api/admin/health
Headers: Authorization: Bearer <token>
Role: admin

Response (200):
{
  "success": true,
  "message": "System health retrieved",
  "data": {
    "database": {
      "status": "connected",
      "connected": true
    },
    "storage": {
      "diskUsage": 5368709120,
      "diskUsageFormatted": "5 GB",
      "fileCount": 500
    },
    "memory": {
      "rss": "150 MB",
      "heapTotal": "100 MB",
      "heapUsed": "75 MB"
    },
    "uptime": 86400,
    "nodeVersion": "v16.20.0"
  }
}
```

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 410 | Gone (expired/limit reached) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 5 requests / 15 minutes |
| File Upload | 20 requests / hour |
| File Download | 50 requests / 15 minutes |
| General API | 100 requests / 15 minutes |
| Admin Operations | 30 requests / minute |

---

## Frontend Integration Example

```javascript
// api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;

// Usage
import api from './api';

// Upload file
const uploadFile = async (file, options) => {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(options).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Get user dashboard
const getDashboard = () => api.get('/dashboard/user');

// Download file
const downloadFile = (token, password) => {
  const url = `${API_BASE_URL}/api/files/download/${token}${password ? `?password=${password}` : ''}`;
  window.open(url, '_blank');
};
```

---

## WebSocket Events (Future)

Currently not implemented, but planned for real-time notifications:

```javascript
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL);

socket.on('file:downloaded', (data) => {
  console.log('File downloaded:', data);
});

socket.on('sharelink:expired', (data) => {
  console.log('Share link expired:', data);
});
```
