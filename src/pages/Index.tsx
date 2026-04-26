import Nav from "@/components/sports/Nav";
import Hero from "@/components/sports/Hero";
import Sports from "@/components/sports/Sports";
import HowItWorks from "@/components/sports/HowItWorks";
import CodeShowcase from "@/components/sports/CodeShowcase";
import Stats from "@/components/sports/Stats";
import LiveDemo from "@/components/sports/LiveDemo";
import CTA from "@/components/sports/CTA";
import Footer from "@/components/sports/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "GenLayer Sports Library — Real-world sports results, on-chain";
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "A Python library for GenLayer Intelligent Contracts: deterministic football, basketball, F1 and tennis results for on-chain bets, prediction markets and fan tokens.",
    );
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Sports />
      <Stats />
      <HowItWorks />
      <CodeShowcase />
      <LiveDemo />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
