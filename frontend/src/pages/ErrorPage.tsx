import { ShieldX, House } from "lucide-react";

function Error() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black px-4 sm:px-6">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-zinc-900 rounded-xl py-8 sm:py-10 md:py-12 px-6 sm:px-8 md:px-12 flex items-center justify-center flex-col">
        <div className="bg-blue-500/20 w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full flex items-center justify-center">
          <ShieldX className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-blue-500" />
        </div>
        <h2 className="font-404 text-blue-500 mt-4 text-4xl sm:text-5xl md:text-6xl">
          404
        </h2>
        <p className="text-white text-lg sm:text-xl md:text-2xl mt-3">
          Sayfa bulunamadı!
        </p>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base text-center max-w-70 sm:max-w-none">
          Aradığınız bağlantı geçersiz veya süresi dolmuş olabilir. Güvenli
          bölgeye geri dönün.
        </p>
        <a
          href="/"
          className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-5 sm:px-6 bg-blue-500 hover:bg-blue-600 transition-colors rounded-full mt-6 sm:mt-7 text-sm sm:text-base text-white"
        >
          <House className="w-4 sm:w-5 h-4 sm:h-5" />
          <span>Ana sayfaya geri dön</span>
        </a>
      </div>
    </div>
  );
}

export default Error;
