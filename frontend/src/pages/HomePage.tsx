import { Clock, Lock, EyeOff } from "lucide-react";
import Navbar from "../components/Navbar";
import FileUpload from "../components/FileUpload";
import FeatureCard from "../components/FeatureCard";
import Footer from "../components/Footer";

function HomePage() {
  const features = [
    {
      icon: Clock,
      iconColor: "bg-blue-500/20 text-blue-400",
      title: "24 Saat Süre",
      description: "Otomatik imha",
    },
    {
      icon: Lock,
      iconColor: "bg-amber-500/20 text-amber-400",
      title: "AES-256 Şifreleme",
      description: "Askeri düzey güvenlik",
    },
    {
      icon: EyeOff,
      iconColor: "bg-rose-500/20 text-rose-400",
      title: "Kayıt Tutulmaz",
      description: "%100 Anonim",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-950 via-black to-zinc-950 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">
            Güvenli Dosya Paylaşımı
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Uçtan uca şifreli ve anonim. Dosyalarınız transfer tamamlandıktan 24
            saat sonra sunucularımızdan otomatik olarak silinir.
          </p>
        </div>

        {/* File Upload Area */}
        <FileUpload />

        {/* Feature Cards */}
        <div className="w-full max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              iconColor={feature.iconColor}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default HomePage;
