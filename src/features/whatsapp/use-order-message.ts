"use client";

import { useShop, useSiteUrl } from "@/features/layout/shop-context";
import { useRegion } from "@/features/region/use-region";
import { buildListMessage, buildSingleMessage, type MessageBook } from "./message";

/**
 * Ready WhatsApp messages for this visitor. Outside Bangladesh it uses the
 * abroad templates, dollar prices and fills [Country] with their country.
 */
export function useOrderMessage() {
  const shop = useShop();
  const siteUrl = useSiteUrl();
  const { abroad, countryName } = useRegion();
  const region = { abroad, rate: shop.usd_rate, country: countryName };
  return {
    abroad,
    single: (book: MessageBook) =>
      buildSingleMessage(abroad ? shop.whatsapp_abroad_template : shop.whatsapp_template, book, shop.currency_symbol, siteUrl, region),
    list: (books: MessageBook[]) =>
      buildListMessage(abroad ? shop.whatsapp_abroad_list_template : shop.whatsapp_list_template, books, shop.currency_symbol, siteUrl, region),
  };
}
