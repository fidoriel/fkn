import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto px-6 py-24">
        <h1 className="text-4xl font-extrabold mb-4">fkn</h1>
        <p className="text-lg text-muted-foreground mb-6">
          fkn ist ein leichtgewichtiges Tool zum lokalen Verwalten und Abfragen
          von Dokumenten mit KI-Unterstützung. Schnell, privat und einfach
          konfigurierbar.
        </p>

        <div className="flex gap-3">
          <Link to="/setup">
            <Button>Jetzt einrichten</Button>
          </Link>
          <Link to="/catalog">
            <Button variant="ghost">Katalog</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
