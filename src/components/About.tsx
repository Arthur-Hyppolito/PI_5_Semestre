import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Heart, Star } from "lucide-react";
import teamImage from "@/assets/team.jpg";

const About = () => {
  const stats = [
    { icon: Trophy, number: "15+", label: "Anos de Experiência" },
    { icon: Users, number: "5000+", label: "Clientes Satisfeitos" },
    { icon: Heart, number: "100%", label: "Paixão pelo Surf" },
    { icon: Star, number: "4.9", label: "Avaliação dos Clientes" },
  ];

  return (
    <section id="quem-somos" className="py-20 bg-gradient-to-b from-sand/20 to-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-ocean bg-clip-text text-transparent">
              Quem Somos
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              A WaveSurf nasceu da paixão pelo surf e do desejo de compartilhar essa energia única com outros surfistas. 
              Há mais de 15 anos, somos referência em equipamentos e serviços especializados.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Nossa equipe é formada por surfistas experientes que entendem as necessidades de cada modalidade. 
              Oferecemos desde produtos para iniciantes até equipamentos profissionais de alta performance.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center p-4 hover:shadow-[var(--shadow-wave)] transition-all duration-300">
                  <CardContent className="p-4">
                    <stat.icon className="h-8 w-8 text-ocean-medium mx-auto mb-2" />
                    <div className="text-2xl font-bold text-ocean-deep">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-2xl shadow-[var(--shadow-ocean)]">
              <img 
                src={teamImage} 
                alt="Equipe WaveSurf - surfistas e especialistas apaixonados pelo esporte"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            {/* Floating element */}
            <div className="absolute -top-4 -right-4 bg-wave text-white p-4 rounded-xl shadow-lg animate-float">
              <Trophy className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;