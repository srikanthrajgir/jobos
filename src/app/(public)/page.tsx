import Hero from "@/components/Hero";

export default function Home() {
  return (
    <>
      <Hero />
      <section className="py-20 bg-bg-secondary">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">The passive job-search problem.</h2>
          <p className="max-w-2xl mx-auto text-text-muted text-lg">Traditional job boards show advertised vacancies; JobOS organises the user’s full job search effort.</p>
        </div>
      </section>
    </>
  );
}
