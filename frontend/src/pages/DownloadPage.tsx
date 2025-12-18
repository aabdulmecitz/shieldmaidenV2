import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filesApi } from '../services/api';
import { FileLock, Download, Lock, Clock, AlertCircle } from 'lucide-react';

function DownloadPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [fileInfo, setFileInfo] = useState<{
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
    } | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchFileInfo = async () => {
            if (!token) {
                navigate('/');
                return;
            }

            try {
                const data = await filesApi.getFileInfo(token);
                setFileInfo(data || null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Dosya bulunamadı veya süresi dolmuş');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFileInfo();
    }, [token, navigate]);

    const handleDownload = async () => {
        if (!token) return;

        if (fileInfo?.shareLink.isPasswordProtected && !password) {
            setError('Şifre gerekli');
            return;
        }

        setIsDownloading(true);
        setError('');

        try {
            const downloadUrl = filesApi.getDownloadUrl(token, password);
            window.location.href = downloadUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'İndirme başarısız');
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error && !fileInfo) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-white text-2xl font-bold mb-2">Dosya Bulunamadı</h1>
                <p className="text-zinc-400 text-center max-w-md mb-6">
                    {error}
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                    Ana Sayfaya Dön
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                    <FileLock className="w-7 h-7 text-blue-500" />
                </div>
                <h1 className="text-white text-3xl tracking-wide font-logo">
                    Shield Maiden
                </h1>
            </div>

            {/* Download Card */}
            <div className="w-full max-w-md bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800">
                {/* Custom Message */}
                {fileInfo?.shareLink.customMessage && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                        <p className="text-blue-300 text-sm">{fileInfo.shareLink.customMessage}</p>
                    </div>
                )}

                {/* File Info */}
                <div className="text-center mb-6">
                    <Download className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h2 className="text-white text-xl font-semibold mb-2">
                        {fileInfo?.file.name}
                    </h2>
                    <p className="text-zinc-400">{fileInfo?.file.sizeFormatted}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm mb-1">
                            <Download className="w-4 h-4" />
                            Kalan İndirme
                        </div>
                        <p className="text-white font-semibold">
                            {fileInfo?.shareLink.remainingDownloads} / {fileInfo?.shareLink.downloadLimit}
                        </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm mb-1">
                            <Clock className="w-4 h-4" />
                            Kalan Süre
                        </div>
                        <p className="text-white font-semibold">{fileInfo?.shareLink.expiresIn}</p>
                    </div>
                </div>

                {/* Password Input */}
                {fileInfo?.shareLink.isPasswordProtected && (
                    <div className="mb-6">
                        <label className="block text-zinc-400 text-xs font-medium tracking-wider mb-2">
                            <Lock className="w-4 h-4 inline mr-1" />
                            ŞİFRE GEREKLİ
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Dosya şifresini girin"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                )}

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {isDownloading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            İndir
                        </>
                    )}
                </button>
            </div>

            {/* Security Notice */}
            <p className="mt-6 text-zinc-500 text-xs text-center max-w-md">
                Bu dosya uçtan uca şifreli olarak korunmaktadır. İndirme işlemi güvenli
                bir şekilde gerçekleştirilecektir.
            </p>
        </div>
    );
}

export default DownloadPage;
