import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublicPortfolio } from "@/lib/portfolio/queries";
import { Hero } from "@/components/portfolio/hero";
import { AboutStack } from "@/components/portfolio/about-stack";
import { ProjectGrid } from "@/components/portfolio/project-grid";
import { ContactFooter } from "@/components/portfolio/contact-footer";

export const metadata: Metadata = {
  title: "Portfolio · PDI OS",
};

// The public landing must not depend on the private experience to render (RNF-PERF-006).
export default async function PortfolioLandingPage() {
  const portfolio = await getPublicPortfolio();

  if (!portfolio?.profile) {
    return (
      <section className="py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Portfolio</p>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">Em construção</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          O conteúdo público ainda não foi configurado.
        </p>
      </section>
    );
  }

  return (
    <>
      <Hero profile={portfolio.profile} status={portfolio.status} />
      <AboutStack profile={portfolio.profile} stack={portfolio.stack} />
      <Suspense fallback={null}>
        <ProjectGrid projects={portfolio.projects} />
      </Suspense>
      <ContactFooter links={portfolio.links} />
    </>
  );
}
