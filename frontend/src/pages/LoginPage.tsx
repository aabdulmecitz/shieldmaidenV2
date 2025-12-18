import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileLock, EyeOff, Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
          <FileLock className="w-7 h-7 text-blue-500" />
        </div>
        <h1 className="text-white text-3xl tracking-wide font-logo">
          Shield Maiden
        </h1>
      </div>

      {/* Login Formu */}
      <div className="w-full max-w-sm bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800">
        <form onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* E-Posta Alanı */}
          <div className="mb-6">
            <label className="block text-zinc-400 text-xs font-medium tracking-wider mb-2">
              E-POSTA
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="isim@sirket.com"
              required
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Şifre Alanı */}
          <div className="mb-2">
            <label className="block text-zinc-400 text-xs font-medium tracking-wider mb-2">
              ŞİFRE
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Şifremi Unuttum */}
          <div className="text-right mb-6">
            <a href="#" className="text-zinc-400 text-sm hover:text-white">
              Unuttunuz mu?
            </a>
          </div>

          {/* Giriş Yap Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg cursor-pointer flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>
      </div>

      {/* Hesap Oluştur Linki */}
      <div className="mt-8 text-zinc-500 text-sm">
        Hesabınız yok mu?{" "}
        <a href="/register" className="text-white font-medium hover:underline">
          Hesap Oluştur
        </a>
      </div>
    </div>
  );
}

export default LoginPage;
