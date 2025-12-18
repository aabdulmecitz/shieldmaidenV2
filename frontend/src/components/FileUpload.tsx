import { useState, useRef } from "react";
import { CloudUpload, Check, Copy, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { filesApi } from "../services/api";

interface UploadResult {
  file: {
    id: string;
    name: string;
    size: number;
    sizeFormatted: string;
  };
  shareLink: {
    token: string;
    url: string;
    expiresAt: string;
    downloadLimit: number;
  };
}

function FileUpload() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    setUploadResult(null);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await filesApi.upload(file, {
        expiresIn: 24, // 24 hours
        downloadLimit: 10,
        accessType: "multiple",
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result) {
        setUploadResult({
          file: {
            id: result.file._id,
            name: result.file.originalName,
            size: result.file.size,
            sizeFormatted: result.file.sizeFormatted,
          },
          shareLink: {
            token: result.shareLink.token,
            url: `${window.location.origin}/download/${result.shareLink.token}`,
            expiresAt: result.shareLink.expiresAt,
            downloadLimit: result.shareLink.downloadLimit,
          },
        });
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = async () => {
    if (uploadResult?.shareLink.url) {
      await navigator.clipboard.writeText(uploadResult.shareLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setUploadResult(null);
    setUploadProgress(0);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Show success state
  if (uploadResult) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 border-2 border-emerald-500/50 rounded-2xl bg-emerald-500/5">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
            <Check className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-white text-xl font-semibold mb-2">
            Dosya Yüklendi!
          </h3>
          <p className="text-zinc-400 text-sm mb-2">
            {uploadResult.file.name} ({uploadResult.file.sizeFormatted})
          </p>

          {/* Share Link */}
          <div className="w-full mt-6 bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <Link2 className="w-4 h-4" />
              Paylaşım Linki
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={uploadResult.shareLink.url}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Kopyalandı
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Kopyala
                  </>
                )}
              </button>
            </div>
            <p className="text-zinc-500 text-xs mt-2">
              Bu link {uploadResult.shareLink.downloadLimit} kez indirilebilir
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
            >
              Başka Dosya Yükle
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Dashboard'a Git
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show uploading state
  if (isUploading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 border-2 border-blue-500/50 rounded-2xl bg-blue-500/5">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>

          <h3 className="text-white text-xl font-semibold mb-2">
            Yükleniyor...
          </h3>

          {/* Progress Bar */}
          <div className="w-full max-w-xs h-2 bg-zinc-700 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-zinc-400 text-sm mt-2">{uploadProgress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full max-w-2xl mx-auto p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${isDragOver
          ? "border-blue-500 bg-blue-500/10"
          : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-600"
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
          <CloudUpload className="w-8 h-8 text-white" />
        </div>

        {/* Error */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Başlık */}
        <h3 className="text-white text-xl font-semibold mb-3">
          Dosyaları Buraya Bırakın
        </h3>

        {/* Alt Açıklama */}
        <p className="text-zinc-400 text-sm mb-2">
          veya bilgisayarınızdan seçmek için alana tıklayın.
        </p>
        <p className="text-zinc-500 text-xs mb-6">
          (Maksimum dosya boyutu: 100MB)
        </p>

        {/* Login hint if not authenticated */}
        {!isAuthenticated && (
          <p className="text-amber-400 text-sm mb-4">
            Dosya yüklemek için giriş yapmalısınız
          </p>
        )}

        {/* Dosya Seç Butonu */}
        <button
          onClick={handleFileSelect}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          {isAuthenticated ? "Dosya Seç" : "Giriş Yap ve Dosya Yükle"}
        </button>

        {/* Gizli File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

export default FileUpload;
