"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { ClientShell } from "@/components/client/client-shell";
import { getClientProfile } from "@/lib/data";

type ClientProfile = Awaited<ReturnType<typeof getClientProfile>>;

export default function MyInformationPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getClientProfile()
      .then(setProfile)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Impossible de charger vos informations.",
        ),
      );
  }, []);

  return (
    <ClientShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Espace client
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Mes informations
          </h1>
          <p className="text-sm text-muted-foreground">
            Consultez les informations enregistrées pour vos commandes.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {profile && (
          <div className="brand-surface overflow-hidden rounded-2xl">
            <div className="flex items-center gap-3 border-b border-border/70 p-5 md:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Informations du compte</h2>
                <p className="text-sm text-muted-foreground">
                  Ces informations sont consultables uniquement par le client.
                </p>
              </div>
            </div>
            <dl className="grid gap-4 p-5 sm:grid-cols-2 md:p-6">
              <InfoItem
                icon={UserRound}
                label="Nom complet"
                value={profile.full_name || "Non renseigné"}
              />
              <InfoItem
                icon={Phone}
                label="WhatsApp"
                value={profile.phone || "Non renseigné"}
              />
              <InfoItem
                icon={Mail}
                label="Email"
                value={profile.email || "Non renseigné"}
              />
              <InfoItem
                icon={MapPin}
                label="Pays de création"
                value="République démocratique du Congo"
              />
              <InfoItem
                icon={MapPin}
                label="Ville de création"
                value={profile.city || "Kinshasa"}
              />
              <InfoItem
                icon={MapPin}
                label="Adresse"
                value={profile.address || "Non renseignée"}
              />
              <InfoItem
                icon={MapPin}
                label="Quartier"
                value={profile.neighborhood || "Non renseigné"}
              />
              <InfoItem
                icon={CalendarDays}
                label="Compte créé le"
                value={
                  profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString("fr-FR")
                    : "Non renseigné"
                }
              />
            </dl>
          </div>
        )}
      </div>
    </ClientShell>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
      <dt className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-bold">{value}</dd>
    </div>
  );
}
