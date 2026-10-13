"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { publicEnv } from "@/lib/env";
import type { ClientSettings } from "@/features/settings/queries";
import { DEFAULT_SETTINGS } from "@/features/settings/defaults";

/**
 * Settings the browser needs (WhatsApp number and templates, currency, order
 * steps). Read on the server once per request and passed down here.
 */
const ShopContext = createContext<ClientSettings>({
  whatsapp_number: DEFAULT_SETTINGS.whatsapp_number,
  whatsapp_template: DEFAULT_SETTINGS.whatsapp_template,
  whatsapp_list_template: DEFAULT_SETTINGS.whatsapp_list_template,
  currency_symbol: DEFAULT_SETTINGS.currency_symbol,
  delivery_note: DEFAULT_SETTINGS.delivery_note,
  response_time: DEFAULT_SETTINGS.response_time,
  how_to_buy_steps: DEFAULT_SETTINGS.how_to_buy_steps,
  features: DEFAULT_SETTINGS.features,
  trending_searches: [],
});

export function ShopProvider({ settings, children }: { settings: ClientSettings; children: ReactNode }) {
  return <ShopContext.Provider value={settings}>{children}</ShopContext.Provider>;
}

export function useShop(): ClientSettings {
  return useContext(ShopContext);
}

const noSubscribe = () => () => {};

/**
 * The address people actually use for this site: the browser's own origin
 * (so shared links always match the domain in the address bar), falling back
 * to the configured site URL during server rendering.
 */
export function useSiteUrl(): string {
  return useSyncExternalStore(
    noSubscribe,
    () => (/^https?:$/.test(window.location.protocol) ? window.location.origin : publicEnv.siteUrl),
    () => publicEnv.siteUrl,
  );
}
