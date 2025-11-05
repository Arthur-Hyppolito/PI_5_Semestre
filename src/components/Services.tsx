import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, GraduationCap, Truck, Users } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Wrench,
      title: "Reparo e Manutenção",
      description: "Consertamos pranchas, wetsuits e todos os equipamentos de surf com técnicas profissionais",
      features: ["Reparo de dings e trincas", "Restauração completa", "Manutenção preventiva", "Garantia de qualidade"],
    },
    {
      icon: GraduationCap,
      title: "Aulas de Surf",
      description: "Aprenda a surfar com instrutores certificados em ambiente seguro e profissional",
      features: ["Aulas individuais", "Grupos pequenos", "Todos os níveis", "Equipamentos inclusos"],
    },
    {
      icon: Truck,
      title: "Entrega e Montagem",
      description: "Entregamos seus equipamentos em casa e fazemos a montagem/setup personalizado",
      features: ["Entrega rápida", "Montagem profissional", "Setup personalizado", "Cobertura regional"],
    },
    {
      icon: Users,
      title: "Consultoria Especializada",
      description: "Assessoria completa na escolha dos melhores equipamentos para seu estilo de surf",
      features: ["Análise de necessidades", "Recomendações personalizadas", "Teste de equipamentos", "Suporte contínuo"],
    },
  ];

  return (
    <section id="servicos" className="py-20 bg-gradient-to-b from-background to-ocean-light/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
            Nossos Serviços
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Soluções completas para surfistas de todos os níveis, com qualidade e profissionalismo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-[var(--shadow-ocean)] transition-all duration-500 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-ocean rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-ocean-deep">
                    {service.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-wave rounded-full"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="wave" className="w-full">
                  Saiba Mais
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-gradient-ocean p-8 rounded-2xl text-white">
            <h3 className="text-2xl font-bold mb-4">Precisa de um Serviço Personalizado?</h3>
            <p className="mb-6">Entre em contato conosco para soluções sob medida</p>
            <Button variant="wave" size="lg">
              Fale Conosco
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;