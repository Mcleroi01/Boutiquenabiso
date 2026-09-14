import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DevisClient } from "@/components/devis-client";

export const revalidate = 60;

export default function DevisPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <DevisClient />
      </main>
      <SiteFooter />
    </div>
  );
}
