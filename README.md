# ShieldMaiden - Secure File Sharing System

![Shieldmaiden Logo](https://github.com/aabdulmecitz/shieldmaidenV2/blob/main/logo.png?raw=true)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)

> Your data's digital guardian: Secure and encrypted file transfer.

**Shieldmaiden: The Aegis of Secure Sharing.**

In the vast expanse of the digital realm, don't leave your data defenseless during transit. True to the warrior spirits it is named after, Shieldmaiden stands as a sentinel against threats, ensuring your files remain untouchable. Equipped with robust, modern encryption algorithms, it is built for those who demand absolute privacy and security. Deploy your files, and trust in the unwavering protection of the Shieldmaiden.

## Features
* End-to-end encryption
* Secure peer-to-peer transfer
* No file size limits

ShieldMaiden is a secure, ephemeral file sharing platform built with Node.js, MongoDB, and React. It features AES-256 encryption, automatic file expiration, role-based access control, and comprehensive audit logging.

## 🌟 Features

### Security
- **AES-256-CTR Encryption**: All files are encrypted before storage
- **JWT Authentication**: Secure user authentication with role-based access
- **Input Sanitization**: All inputs are validated and sanitized
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Password-Protected Links**: Optional password protection for share links

### File Management
- **Ephemeral Storage**: Files automatically expire and are deleted
- **Download Limits**: Configure maximum downloads per share link
- **Multiple Access Types**: Single-use, limited, or unlimited downloads
- **Soft Delete**: Files are marked for deletion before physical removal

### Sharing & Access Control
- **Flexible Share Links**: Create multiple share links per file
- **IP Whitelisting**: Restrict access by IP address
- **Email Whitelisting**: Limit access to specific email addresses
- **Custom Messages**: Add custom messages to share links
- **Expiration Control**: Set custom expiration times

### Administration
- **User Management**: Admin panel for user administration
- **Audit Logging**: Complete download history and audit trail
- **System Metrics**: Dashboard with usage statistics
- **Health Monitoring**: System health and resource monitoring

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache/Queue**: Redis (optional, for rate limiting)
- **Authentication**: JWT (JSON Web Tokens)
- **Encryption**: Node.js Crypto (AES-256-CTR)
- **Monitoring**: Prometheus & Grafana
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js >= 16.0.0
- MongoDB >= 7.0
- Redis >= 7.0 (optional, for distributed rate limiting)
- Docker & Docker Compose (for containerized deployment)

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shieldmaiden
   ```

2. **Configure environment variables**
   ```bash
   cp backend/env.example backend/.env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - Grafana: http://localhost:3002 (admin/admin)
   - Prometheus: http://localhost:9090

### Manual Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB and Redis**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   ```

4. **Run the backend**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "displayName": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### File Management Endpoints

#### Upload File
```http
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
expiresIn: 24 (hours)
downloadLimit: 10
accessType: multiple
password: optional-password
```

#### Get My Files
```http
GET /api/files/my-files?limit=50&skip=0
Authorization: Bearer <token>
```

#### Get File Details
```http
GET /api/files/:id
Authorization: Bearer <token>
```

#### Delete File
```http
DELETE /api/files/:id
Authorization: Bearer <token>
```

### Share Link Endpoints

#### Create Share Link
```http
POST /api/files/:fileId/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "accessType": "multiple",
  "downloadLimit": 10,
  "expiresIn": 24,
  "password": "optional",
  "customMessage": "Here's your file!",
  "allowedIPs": ["192.168.1.1"],
  "allowedEmails": ["user@example.com"],
  "requiresAuth": false,
  "notifyOnDownload": true
}
```

#### Get Share Links for File
```http
GET /api/files/:fileId/shares
Authorization: Bearer <token>
```

#### Get My Share Links
```http
GET /api/share/my-links?activeOnly=true
Authorization: Bearer <token>
```

#### Update Share Link
```http
PUT /api/share/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "downloadLimit": 20,
  "customMessage": "Updated message"
}
```

#### Deactivate Share Link
```http
DELETE /api/share/:id
Authorization: Bearer <token>
```

### Download Endpoints (Public)

#### Get File Info
```http
GET /api/files/info/:token
```

#### Download File
```http
GET /api/files/download/:token?password=optional
```

### Dashboard Endpoints

#### User Dashboard
```http
GET /api/dashboard/user
Authorization: Bearer <token>
```

#### Admin Dashboard
```http
GET /api/dashboard/admin
Authorization: Bearer <token>
Role: admin
```

#### Get Metrics
```http
GET /api/dashboard/metrics?days=30
Authorization: Bearer <token>
```

#### Get Download History
```http
GET /api/dashboard/downloads?limit=50&skip=0
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get All Users
```http
GET /api/admin/users?limit=50&skip=0&search=john
Authorization: Bearer <token>
Role: admin
```

#### Get All Files
```http
GET /api/admin/files?limit=50&skip=0
Authorization: Bearer <token>
Role: admin
```

#### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <token>
Role: admin
```

#### Update User Role
```http
PUT /api/admin/users/:id/role
Authorization: Bearer <token>
Role: admin
Content-Type: application/json

{
  "role": "admin"
}
```

#### Get Audit Logs
```http
GET /api/admin/audit?limit=100&skip=0
Authorization: Bearer <token>
Role: admin
```

#### Get System Health
```http
GET /api/admin/health
Authorization: Bearer <token>
Role: admin
```

## 🔐 Environment Variables

See `backend/env.example` for all available configuration options.

### Required Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 5000)

### Optional Variables
- `REDIS_URL`: Redis connection string for rate limiting
- `FRONTEND_URL`: Frontend URL for CORS and share links
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 100MB)
- `STORAGE_QUOTA_PER_USER`: Storage quota per user in bytes (default: 1GB)
- `CLEANUP_CRON_SCHEDULE`: Cron schedule for cleanup job (default: `0 * * * *`)

## 📊 Architecture

### Service Layer (SOLID Principles)
- **FileService**: File upload, encryption, and management
- **ShareLinkService**: Share link creation and validation
- **AnalyticsService**: Metrics and reporting

### Models
- **User**: User accounts and authentication
- **File**: Encrypted file metadata
- **ShareLink**: Share link configuration and tracking
- **DownloadLog**: Audit trail for downloads

### Middleware
- **Authentication**: JWT verification
- **Authorization**: Role-based access control
- **Rate Limiting**: Request throttling
- **Validation**: Input validation and sanitization
- **Error Handling**: Centralized error handling

## 🔄 Automated Cleanup

The system includes an automated cleanup job that runs hourly (configurable):

1. **Deactivates expired share links**
2. **Marks orphaned files** (files with no active share links)
3. **Deletes marked files** from disk and database

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📈 Monitoring

Access Grafana dashboards at `http://localhost:3002`:
- System metrics
- API performance
- Download statistics
- Error rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Ahmet Abdulmecit Ozkaya

## 🙏 Acknowledgments

- Built for the Bilişim Vadisi Competition
- Inspired by secure file sharing best practices
- Uses industry-standard encryption and security measures
