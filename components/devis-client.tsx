"use client";

import { useRef, useState } from "react";
import {
  FileText,
  ImagePlus,
  Info,
  Link2,
  Loader2,
  Send,
  ShoppingBag,
  Upload,
  UserRound,
} from "lucide-react";
import { createQuote, uploadPublicImage } from "@/lib/data";
import { QuotePlatform } from "@/lib/types";
import { PlatformsSection } from "./platform-mark";

const platforms: QuotePlatform[] = [
  "Pinduoduo",
  "Xianyu",
  "1688",
  "Alibaba",
  "Shein",
  "Autre",
];
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

export function DevisClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [platform, setPlatform] = useState<QuotePlatform | "">("");
  const [productLink, setProductLink] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [images, setImages] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleImageChange = (files: FileList | null) => {
    setError("");
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.some((file) => !acceptedImageTypes.includes(file.type))) {
      setError("Image invalide. Utilisez un fichier JPG, PNG ou WebP.");
      return;
    }
    if (selected.some((file) => file.size > maxImageSize)) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setImages(selected);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.info("[quote] soumission démarrée");
    setError("");
    setSuccess(false);
    const parsedQuantity = Number.parseInt(quantity, 10);
    if (!fullName.trim() || !phone.trim() || !description.trim()) {
      console.warn("[quote] validation échouée: champs obligatoires manquants");
      setError(
        "Nom, numéro WhatsApp et description du produit sont obligatoires.",
      );
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      console.warn("[quote] validation échouée: quantité invalide", quantity);
      setError("La quantité doit être un nombre entier supérieur à zéro.");
      return;
    }
    if (productLink.trim() && !/^https?:\/\//i.test(productLink.trim())) {
      console.warn("[quote] validation échouée: lien invalide", productLink);
      setError("Le lien du produit doit commencer par http:// ou https://.");
      return;
    }

    setSubmitting(true);
    try {
      console.info("[quote] traitement démarré", { imageCount: images.length });
      const imageUrls = await Promise.all(
        images.map((image) => {
          const path = `${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
          return uploadPublicImage("quote-images", image, path);
        }),
      );
      await createQuote({
        full_name: fullName.trim(),
        whatsapp: phone.trim(),
        platform: platform || null,
        product_link: productLink.trim() || null,
        product_description: description.trim(),
        quantity: parsedQuantity,
        image_path: imageUrls[0] || null,
        image_paths: imageUrls,
        message: message.trim() || null,
      });
      console.info("[quote] demande terminée avec succès");
      setSuccess(true);
      setFullName("");
      setPhone("");
      setProductLink("");
      setDescription("");
      setQuantity("1");
      setImages([]);
      setMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (submissionError) {
      console.error("[quote] erreur complète", submissionError);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Impossible d'envoyer la demande.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Demander un devis
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Décrivez le produit que vous souhaitez acheter. Notre équipe
                analysera votre demande et vous répondra directement.
              </p>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Plateformes prises en charge
            </p>
            <PlatformsSection compact />
          </div>
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
            Vous pouvez demander un produit qui n’est pas dans notre catalogue.
            Indiquez simplement son nom ou envoyez une image. Si vous ne
            connaissez pas la plateforme chinoise ou le lien du produit, laissez
            ces champs vides.
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          onSubmitCapture={() =>
            console.info("[quote] événement submit reçu par le formulaire")
          }
          className="brand-surface rounded-2xl p-5 md:p-8"
        >
          <div className="mb-6 border-b border-border/70 pb-5">
            <h2 className="text-lg font-bold">Informations de votre demande</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Les champs marqués d’un astérisque sont obligatoires.
            </p>
          </div>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-bold">
                <span className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-primary" />
                  Nom complet *
                </span>
                <input
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-3 font-normal"
                  placeholder="Votre nom complet"
                />
              </label>
              <label className="space-y-2 text-sm font-bold">
                <span>Numéro WhatsApp *</span>
                <input
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-3 font-normal"
                  placeholder="+243 81 234 5678"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_0.65fr]">
              <label className="space-y-2 text-sm font-bold">
                <span>Plateforme (facultatif)</span>
                <select
                  value={platform}
                  onChange={(event) =>
                    setPlatform(event.target.value as QuotePlatform)
                  }
                  className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-3 font-normal"
                >
                  <option value="">Je ne sais pas</option>
                  {platforms.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold">
                <span>Quantité *</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-3 font-normal"
                />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-bold">
              <span className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Lien du produit
              </span>
              <input
                type="url"
                value={productLink}
                onChange={(event) => setProductLink(event.target.value)}
                className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-3 font-normal"
                placeholder="https://detail.1688.com/..."
              />
            </label>
            <label className="block space-y-2 text-sm font-bold">
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Nom ou description du produit *
              </span>
              <textarea
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="focus-ring w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-normal"
                placeholder="Ex : iPhone 15 Pro Max 256GB, titane naturel..."
              />
            </label>
            <label className="block space-y-2 text-sm font-bold">
              <span className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-primary" />
                Image du produit
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleImageChange(event.target.files)}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-white px-4 py-4 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Upload className="h-4 w-4" />
                {images.length
                  ? `${images.length} image(s) sélectionnée(s)`
                  : "Choisir une ou plusieurs images (5 Mo maximum par image)"}
              </button>
            </label>
            <label className="block space-y-2 text-sm font-bold">
              <span>Message ou détails supplémentaires</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                className="focus-ring w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-normal"
                placeholder="Couleur, taille, modèle, contraintes de livraison..."
              />
            </label>
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
              >
                Votre demande a bien été envoyée. Notre équipe vous répondra sur
                WhatsApp après analyse.
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              onClick={() =>
                console.info("[quote] bouton Envoyer ma demande cliqué")
              }
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-teal-900/10 transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </button>
            <div className="flex items-start gap-2.5 rounded-2xl bg-accent/60 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Vos informations sont transmises à notre équipe pour préparer
                votre devis. L’image est stockée séparément dans Supabase
                Storage.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
