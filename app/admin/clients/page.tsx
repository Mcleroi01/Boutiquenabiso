"use client";

import { useEffect, useState } from "react";
import { Contact, Loader2, Search } from "lucide-react";
import { getAdminClients } from "@/lib/data";

type Client = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  created_at: string;
};
export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getAdminClients()
      .then(setClients)
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Impossible de charger les clients.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const filtered = clients.filter((c) =>
    `${c.full_name || ""} ${c.email || ""} ${c.phone || ""} ${c.city || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Clients</h1>
        <p className="text-sm text-muted-foreground">
          {clients.length} comptes clients.
        </p>
      </div>
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou WhatsApp"
          className="focus-ring w-full rounded-xl border bg-white py-3 pl-10 pr-4"
        />
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="space-y-3">
        {filtered.map((client) => (
          <article
            key={client.id}
            className="brand-surface flex items-center gap-4 rounded-2xl p-5"
          >
            <Contact className="h-8 w-8 text-primary" />
            <div>
              <h2 className="font-bold">
                {client.full_name || "Client sans nom"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {client.email || "Email non renseigné"} ·{" "}
                {client.phone || "WhatsApp non renseigné"} ·{" "}
                {client.city || "Ville non renseignée"}
                {client.location_latitude != null &&
                  client.location_longitude != null && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        className="font-bold text-primary"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.google.com/maps?q=${client.location_latitude},${client.location_longitude}`}
                      >
                        Voir la position
                      </a>
                    </>
                  )}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
