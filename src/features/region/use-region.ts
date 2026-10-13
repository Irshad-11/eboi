"use client";

import { useSyncExternalStore } from "react";
import { formatPrice } from "@/lib/format";
import { useShop } from "@/features/layout/shop-context";
import { countryName, formatUsd, HOME_COUNTRY, localPrice, localTotal, REGION_COOKIE } from "./region";

const noSubscribe = () => () => {};
const pattern = new RegExp(`(?:^|;\\s*)${REGION_COOKIE}=([A-Z]{2})`);
const readCountry = () => pattern.exec(document.cookie)?.[1] ?? null;

/** Two-letter country of the visitor, from the cookie proxy.ts sets. Null while server rendering. */
export function useCountry(): string | null {
  return useSyncExternalStore(noSubscribe, readCountry, () => null);
}

export type Region = { country: string | null; countryName: string; abroad: boolean };

/** Abroad = the admin switched dollar prices on and the visitor is outside Bangladesh. */
export function useRegion(): Region {
  const { abroad_enabled } = useShop();
  const country = useCountry();
  return { country, countryName: countryName(country), abroad: abroad_enabled && country != null && country !== HOME_COUNTRY };
}

type PricingLike = Parameters<typeof localPrice>[0];

/** Prices in the visitor's currency, formatted. */
export function useMoney() {
  const { currency_symbol, usd_rate } = useShop();
  const region = useRegion();
  const fmt = (n: number, usd: boolean) => (usd ? formatUsd(n) : formatPrice(n, currency_symbol));
  return {
    ...region,
    rate: usd_rate,
    price: (p: PricingLike) => localPrice(p, region.abroad, usd_rate),
    total: (list: PricingLike[]) => localTotal(list, region.abroad, usd_rate),
    fmt,
  };
}
