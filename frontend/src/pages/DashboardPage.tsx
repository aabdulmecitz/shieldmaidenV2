import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { filesApi, dashboardApi, type DashboardData, type FileInfo } from '../services/api';
import Navbar from '../components/Navbar';
import {
    Upload,
    File,
    Link2,
    Trash2,
    Copy,
    Check,
    HardDrive,
    TrendingUp,
    Clock,
} from 'lucide-react';

function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const [dashboard, filesData] = await Promise.all([
                    dashboardApi.getUserDashboard(),
                    filesApi.getMyFiles(),
                ]);
                setDashboardData(dashboard || null);
                setFiles(filesData?.files || []);
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleDeleteFile = async (fileId: string) => {
        if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;

        try {
            await filesApi.deleteFile(fileId);
            setFiles(files.filter((f) => f._id !== fileId));
        } catch (error) {
            console.error('Failed to delete file:', error);
        }
    };

    const handleCopyLink = async (token: string) => {
        const url = `${window.location.origin}/download/${token}`;
        await navigator.clipboard.writeText(url);
        setCopiedId(token);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const storagePercentage = dashboardData?.user?.storagePercentage || 0;
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
            <Navbar />

            <main className="pt-24 pb-12 px-4 max-w-6xl mx-auto">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-white text-3xl font-bold mb-2">
                        Hoş geldin, {user?.displayName || user?.username}
                    </h1>
                    <p className="text-zinc-400">Dosyalarını yönet ve paylaş</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={<HardDrive className="w-5 h-5" />}
                        title="Depolama"
                        value={`${storagePercentage}%`}
                        subtitle={`${formatBytes(dashboardData?.user?.storageUsed || 0)} / ${formatBytes(dashboardData?.user?.storageQuota || 0)}`}
                        color="blue"
                    />
                    <StatCard
                        icon={<File className="w-5 h-5" />}
                        title="Dosyalar"
                        value={String(dashboardData?.files?.total || 0)}
                        subtitle="Toplam dosya"
                        color="emerald"
                    />
                    <StatCard
                        icon={<Link2 className="w-5 h-5" />}
                        title="Paylaşım Linkleri"
                        value={String(dashboardData?.shareLinks?.activeLinks || 0)}
                        subtitle="Aktif link"
                        color="amber"
                    />
                    <StatCard
                        icon={<TrendingUp className="w-5 h-5" />}
                        title="İndirmeler"
                        value={String(dashboardData?.downloads?.totalDownloads || 0)}
                        subtitle="Toplam indirme"
                        color="rose"
                    />
                </div>

                {/* Upload Button */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        <Upload className="w-5 h-5" />
                        Yeni Dosya Yükle
                    </button>
                </div>

                {/* Files List */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-white text-lg font-semibold">Dosyalarım</h2>
                    </div>

                    {files.length === 0 ? (
                        <div className="p-12 text-center">
                            <File className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-400">Henüz dosya yüklemediniz</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {files.map((file) => (
                                <div
                                    key={file._id}
                                    className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <File className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{file.originalName}</p>
                                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                                <span>{file.sizeFormatted}</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(file.createdAt).toLocaleDateString('tr-TR')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Link2 className="w-3 h-3" />
                                                    {file.activeShareLinks || 0} aktif link
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCopyLink(file._id)}
                                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                                            title="Linki Kopyala"
                                        >
                                            {copiedId === file._id ? (
                                                <Check className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <Copy className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteFile(file._id)}
                                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function StatCard({
    icon,
    title,
    value,
    subtitle,
    color,
}: {
    icon: ReactNode;
    title: string;
    value: string;
    subtitle: string;
    color: 'blue' | 'emerald' | 'amber' | 'rose';
}) {
    const colors = {
        blue: 'bg-blue-500/20 text-blue-400',
        emerald: 'bg-emerald-500/20 text-emerald-400',
        amber: 'bg-amber-500/20 text-amber-400',
        rose: 'bg-rose-500/20 text-rose-400',
    };

    return (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-zinc-400 text-sm mb-1">{title}</p>
            <p className="text-white text-2xl font-bold">{value}</p>
            <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>
        </div>
    );
}

export default DashboardPage;
