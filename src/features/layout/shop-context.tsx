"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ClientSettings } from "@/features/settings/queries";
import { DEFAULT_SETTINGS } from "@/features/settings/defaults";

/**
 * Settings the browser needs (WhatsApp number and templates, currency).
 * Read on the server once per request and handed down here, so client
 * components never query the database themselves.
 */
const ShopContext = createContext<ClientSettings>({
  whatsapp_number: DEFAULT_SETTINGS.whatsapp_number,
  whatsapp_template: DEFAULT_SETTINGS.whatsapp_template,
  whatsapp_list_template: DEFAULT_SETTINGS.whatsapp_list_template,
  currency_symbol: DEFAULT_SETTINGS.currency_symbol,
  delivery_note: DEFAULT_SETTINGS.delivery_note,
});

export function ShopProvider({ settings, children }: { settings: ClientSettings; children: ReactNode }) {
  return <ShopContext.Provider value={settings}>{children}</ShopContext.Provider>;
}

export function useShop(): ClientSettings {
  return useContext(ShopContext);
}
