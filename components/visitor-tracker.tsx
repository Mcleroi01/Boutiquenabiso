"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const VISITOR_KEY = "bnb_visitor_key";
const SESSION_KEY = "bnb_visit_session";

function getOrCreateStorageValue(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  storage.setItem(key, value);
  return value;
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (window.matchMedia("(max-width: 639px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1023px)").matches) return "tablet";
  return "desktop";
}

export function VisitorTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const visitorKey = getOrCreateStorageValue(localStorage, VISITOR_KEY);
    const sessionKey = getOrCreateStorageValue(sessionStorage, SESSION_KEY);

    void supabase
      .rpc("track_site_page_view", {
        p_visitor_key: visitorKey,
        p_session_key: sessionKey,
        p_path: pathname,
        p_page_title: document.title,
        p_referrer: document.referrer,
        p_device_type: getDeviceType(),
      })
      .then(() => undefined);
  }, [pathname, user?.id]);

  return null;
}
