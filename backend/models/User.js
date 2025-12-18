const mongoose = require('mongoose');

/**
 * User Schema
 * ShieldMaiden - Secure File Sharing System
 * 
 * Kullanıcı profili, authentication bilgileri ve rol yönetimi
 */
const userSchema = new mongoose.Schema({
    // Authentication
    username: {
        type: String,
        required: [true, 'Kullanıcı adı zorunludur'],
        unique: true,
        trim: true,
        minlength: [3, 'Kullanıcı adı en az 3 karakter olmalıdır'],
        maxlength: [30, 'Kullanıcı adı en fazla 30 karakter olabilir'],
        match: [/^[a-zA-Z0-9_]+$/, 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir']
    },
    email: {
        type: String,
        required: [true, 'Email zorunludur'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Geçerli bir email adresi giriniz']
    },
    password: {
        type: String,
        required: [true, 'Şifre zorunludur'],
        minlength: [6, 'Şifre en az 6 karakter olmalıdır']
    },

    // Profile
    displayName: {
        type: String,
        trim: true,
        maxlength: [50, 'Görünen ad en fazla 50 karakter olabilir']
    },
    avatar: {
        type: String,
        default: null
    },

    // Role & Permissions
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    // Storage Management
    storageUsed: {
        type: Number,
        default: 0 // Bytes
    },
    storageQuota: {
        type: Number,
        default: 1073741824 // 1GB in bytes
    },

    // Encryption Keys (for RSA end-to-end encryption)
    encryption: {
        publicKey: {
            type: String,
            default: null
        },
        lastKeyUpdate: {
            type: Date,
            default: null
        }
    },

    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    lastLoginAt: {
        type: Date,
        default: null
    },

    // Statistics
    stats: {
        totalFilesUploaded: { type: Number, default: 0 },
        totalDownloads: { type: Number, default: 0 },
        totalShareLinks: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for storage percentage
userSchema.virtual('storagePercentage').get(function () {
    if (this.storageQuota === 0) return 0;
    return Math.round((this.storageUsed / this.storageQuota) * 100);
});

// Virtual for formatted storage values
userSchema.virtual('storageFormatted').get(function () {
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
        used: formatBytes(this.storageUsed),
        limit: formatBytes(this.storageQuota),
        available: formatBytes(this.storageQuota - this.storageUsed)
    };
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Pre-save hook to set displayName
userSchema.pre('save', function (next) {
    if (!this.displayName) {
        this.displayName = this.username;
    }
    next();
});

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to find admins
userSchema.statics.findAdmins = function () {
    return this.find({ role: 'admin', isActive: true });
};

// Instance method to check storage availability
userSchema.methods.hasStorageSpace = function (bytes) {
    return (this.storageUsed + bytes) <= this.storageQuota;
};

// Instance method to update storage usage
userSchema.methods.updateStorageUsed = async function (bytesChange) {
    this.storageUsed = Math.max(0, this.storageUsed + bytesChange);
    return this.save();
};

// Instance method to increment stats
userSchema.methods.incrementStat = async function (statName, amount = 1) {
    const validStats = ['totalFilesUploaded', 'totalDownloads', 'totalShareLinks'];
    if (validStats.includes(statName)) {
        this.stats[statName] += amount;
        return this.save();
    }
    return this;
};

module.exports = mongoose.model('User', userSchema);
