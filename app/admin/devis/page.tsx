"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Search,
  Send,
  X,
} from "lucide-react";
import { convertQuote, getQuotes, updateQuote } from "@/lib/data";
import {
  Quote,
  QuoteStatus,
  QUOTE_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUSES,
} from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  const loadQuotes = useCallback(async () => {
    try {
      setQuotes(await getQuotes());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les demandes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const beginEdit = (quote: Quote) => {
    setEditingId(quote.id);
    setPrice(quote.proposed_price?.toString() || "");
    setNote(quote.admin_note || "");
    setError("");
  };

  const saveQuote = async (quote: Quote, nextStatus?: QuoteStatus) => {
    const proposedPrice = price.trim() ? Number(price) : quote.proposed_price;
    if (
      proposedPrice !== null &&
      (!Number.isFinite(proposedPrice) || proposedPrice < 0)
    ) {
      setError("Le prix proposé est invalide.");
      return;
    }
    setSavingId(quote.id);
    setError("");
    try {
      await updateQuote(quote.id, {
        status: nextStatus || quote.status,
        proposed_price: proposedPrice,
        admin_note: note.trim() || null,
      });
      setEditingId(null);
      await loadQuotes();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible de mettre à jour la demande.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = async (quote: Quote, nextStatus: QuoteStatus) => {
    setSavingId(quote.id);
    setError("");
    try {
      await updateQuote(quote.id, {
        status: nextStatus,
        proposed_price: quote.proposed_price,
        admin_note: quote.admin_note,
      });
      await loadQuotes();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Impossible de mettre à jour le statut.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleConvert = async (quote: Quote) => {
    const proposedPrice = Number(price || quote.proposed_price);
    if (!Number.isFinite(proposedPrice) || proposedPrice < 0) {
      setError("Saisissez un prix proposé avant de convertir la demande.");
      return;
    }
    setSavingId(quote.id);
    setError("");
    try {
      await convertQuote(
        quote.id,
        proposedPrice,
        note.trim() || quote.admin_note,
      );
      setEditingId(null);
      await loadQuotes();
    } catch (convertError) {
      setError(
        convertError instanceof Error
          ? convertError.message
          : "Impossible de convertir la demande.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const filtered = quotes.filter((quote) => {
    const query = search.toLowerCase();
    return (
      !query ||
      (quote.full_name || quote.customer_name).toLowerCase().includes(query) ||
      (quote.whatsapp || quote.customer_phone).includes(query) ||
      quote.product_description.toLowerCase().includes(query)
    );
  });

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Chargement...
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Suivi client
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Demandes de devis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {quotes.length} demande{quotes.length !== 1 ? "s" : ""} enregistrée
          {quotes.length !== 1 ? "s" : ""}.
        </p>
      </div>
      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par client, téléphone ou produit..."
          className="focus-ring w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 text-sm"
        />
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      <div className="space-y-4">
        {filtered.length ? (
          filtered.map((quote) => {
            const editing = editingId === quote.id;
            const customerName = quote.full_name || quote.customer_name;
            const customerPhone = quote.whatsapp || quote.customer_phone;
            const imageUrl = quote.image_path || quote.image_url;
            const platform = quote.platform || "Non précisée";
            return (
              <article key={quote.id} className="brand-surface rounded-2xl p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    {imageUrl ? (
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
                      >
                        <img
                          src={imageUrl}
                          alt="Produit demandé"
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <FileText className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold">{customerName}</h2>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-bold",
                            QUOTE_STATUS_COLORS[quote.status],
                          )}
                        >
                          {QUOTE_STATUS_LABELS[quote.status]}
                        </span>
                      </div>
                      <a
                        href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#25D366] hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" />
                        {customerPhone}
                      </a>
                      <p className="text-sm text-muted-foreground">
                        {quote.product_description} × {quote.quantity}
                      </p>
                      {quote.message && (
                        <p className="text-xs italic text-muted-foreground">
                          Message : {quote.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Plateforme : {platform} ·{" "}
                        {new Date(quote.created_at).toLocaleDateString(
                          "fr-FR",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                      {quote.product_link && (
                        <a
                          href={quote.product_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Voir le lien produit{" "}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {!quote.product_link && (
                        <p className="text-xs text-muted-foreground">
                          Lien : Aucun lien fourni
                        </p>
                      )}
                      {!imageUrl && (
                        <p className="text-xs text-muted-foreground">
                          Image : Aucune image fournie
                        </p>
                      )}
                      {platform === "Non précisée" && (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600">
                          Recherche de produit
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <select
                      value={quote.status}
                      onChange={(event) =>
                        void handleStatusChange(
                          quote,
                          event.target.value as QuoteStatus,
                        )
                      }
                      disabled={savingId === quote.id}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-bold outline-none",
                        QUOTE_STATUS_COLORS[quote.status],
                      )}
                    >
                      {QUOTE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {QUOTE_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        editing ? setEditingId(null) : beginEdit(quote)
                      }
                      className="rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
                    >
                      {editing ? "Fermer" : "Traiter"}
                    </button>
                  </div>
                </div>
                {editing && (
                  <div className="mt-5 grid gap-4 border-t border-border/70 pt-5 md:grid-cols-[0.7fr_1.3fr_auto] md:items-end">
                    <label className="space-y-2 text-sm font-bold">
                      <span>Prix proposé (USD)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        className="focus-ring w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-bold">
                      <span>Note interne</span>
                      <input
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="focus-ring w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-normal"
                        placeholder="Détails du devis ou suivi client..."
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingId === quote.id}
                        onClick={() => void saveQuote(quote, "quoted")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        disabled={savingId === quote.id}
                        onClick={() => void handleConvert(quote)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Convertir
                      </button>
                    </div>
                  </div>
                )}
                {!editing && quote.proposed_price !== null && (
                  <p className="mt-4 text-sm font-black text-primary">
                    Prix proposé : {formatPrice(quote.proposed_price)}
                  </p>
                )}
              </article>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <X className="mb-2 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Aucune demande trouvée.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
