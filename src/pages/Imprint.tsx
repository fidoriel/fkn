import { Link } from "react-router-dom";

export default function Imprint() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          ← Zurück
        </Link>

        <h1 className="text-4xl font-bold mb-8">Impressum</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              Angaben gemäß § 5 TMG:
            </p>
            <p>
              FKN — Plattformprojekt
              <br />
              Musterstraße 1
              <br />
              00000 Musterstadt
            </p>
            <p className="mt-4">
              Kontakt: <a href="mailto:info@fkn.local">info@fkn.local</a>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Hinweis: Dies ist ein Platzhalter-Impressum für das Projekt "fkn".
              Bitte ersetzen Sie diese Angaben durch die korrekten Betreiber-
              und Kontaktinformationen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
