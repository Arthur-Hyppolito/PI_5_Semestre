import { Waves, Instagram, Facebook, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-ocean-deep text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Waves className="h-8 w-8 text-ocean-light" />
              <span className="text-xl font-bold">WaveSurf</span>
            </div>
            <p className="text-gray-300 mb-4">
              Sua loja especializada em surf há mais de 15 anos. Oferecemos os melhores equipamentos e serviços para surfistas de todos os níveis.
            </p>
            <div className="flex space-x-4">
              <Instagram className="h-6 w-6 hover:text-ocean-light cursor-pointer transition-colors" />
              <Facebook className="h-6 w-6 hover:text-ocean-light cursor-pointer transition-colors" />
              <Youtube className="h-6 w-6 hover:text-ocean-light cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li><a href="#produtos" className="text-gray-300 hover:text-ocean-light transition-colors">Produtos</a></li>
              <li><a href="#quem-somos" className="text-gray-300 hover:text-ocean-light transition-colors">Quem Somos</a></li>
              <li><a href="#servicos" className="text-gray-300 hover:text-ocean-light transition-colors">Serviços</a></li>
              <li><a href="/login" className="text-gray-300 hover:text-ocean-light transition-colors">Área Gerencial</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-2 text-gray-300">
              <li>📍 Rua das Ondas, 123</li>
              <li>🏖️ Praia Grande, SP</li>
              <li>📞 (13) 1234-5678</li>
              <li>✉️ contato@wavesurf.com.br</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-ocean-medium/30 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 WaveSurf. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;