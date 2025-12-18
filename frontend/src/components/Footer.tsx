function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-8 border-t border-zinc-800/50 bg-zinc-950/50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Copyright */}
        <p className="text-zinc-400 text-sm mb-3">
          © {currentYear} Shield Maiden.
        </p>

        {/* Links */}
        <div className="flex items-center justify-center gap-4">
          <a
            href="#"
            className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
          >
            Gizlilik Politikası
          </a>
          <span className="text-zinc-700">•</span>
          <a
            href="#"
            className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
          >
            Kullanım Şartları
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
