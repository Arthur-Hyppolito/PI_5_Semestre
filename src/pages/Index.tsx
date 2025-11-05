import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import About from "@/components/About";
import Services from "@/components/Services";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" role="main">
        <Hero />
        <Products />
        <About />
        <Services />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
