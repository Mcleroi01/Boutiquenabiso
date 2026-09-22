"use client";

import { useEffect, useState } from "react";
import { ClientShell } from "@/components/client/client-shell";
import { supabase } from "@/lib/supabase";

export default function MyQuotesPage() {
  const [quotes, setQuotes] = useState<
    {
      id: string;
      product_description: string;
      status: string;
      created_at: string;
    }[]
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const result = await supabase
        .from("quotes")
        .select("id,product_description,status,created_at")
        .eq("customer_id", data.user.id)
        .order("created_at", { ascending: false });
      if (result.error) setError(result.error.message);
      else setQuotes(result.data || []);
    });
  }, []);
  return (
    <ClientShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-black">Mes demandes de devis</h1>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {quotes.length === 0 ? (
          <p className="text-muted-foreground">
            Aucune demande liée à votre compte.
          </p>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <article key={q.id} className="brand-surface rounded-2xl p-5">
                <p className="font-bold">{q.product_description}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {q.status} ·{" "}
                  {new Date(q.created_at).toLocaleDateString("fr-FR")}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </ClientShell>
  );
}
