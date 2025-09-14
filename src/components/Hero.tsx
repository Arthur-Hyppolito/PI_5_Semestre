import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-surf.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Surfista profissional pegando uma onda perfeita" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-deep/80 via-ocean-medium/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-float">
            Viva a
            <span className="block bg-gradient-to-r from-ocean-light to-wave bg-clip-text text-transparent">
              Onda Perfeita
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Equipamentos premium, serviços especializados e paixão pelo surf. 
            Tudo que você precisa para dominar as ondas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="ocean" size="lg" className="text-lg px-8 py-4">
              Ver Produtos
            </Button>
            <Button variant="wave" size="lg" className="text-lg px-8 py-4">
              Nossos Serviços
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-wave">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;