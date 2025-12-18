import { FileLock, UserRound, UserRoundCheck, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <FileLock className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-white text-xl font-logo tracking-wide">
            Shield Maiden
          </span>
        </Link>

        {/* Sağ Butonlar */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* User info */}
              <span className="text-zinc-400 text-sm hidden md:block">
                Merhaba, <span className="text-white">{user?.displayName || user?.username}</span>
              </span>

              {/* Dashboard Link */}
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                <UserRound className="w-4 h-4" />
                Giriş Yap
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-700 transition-colors cursor-pointer"
              >
                <UserRoundCheck className="w-4 h-4" />
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
