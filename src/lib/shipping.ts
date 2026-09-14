/**
 * Static zone-based shipping rates for Nigeria, modeled on observed 2026
 * courier pricing (GIG Logistics GoFaster tiers: same-city ₦3,000–5,000,
 * interstate ₦4,500–9,000 depending on route/weight, plus a door-to-door
 * surcharge). This is a flat-rate approximation good enough for an MVP —
 * swap `getShippingFee` for a live carrier-rate API call when you're ready
 * to quote real weight/volumetric pricing.
 *
 * All amounts are in kobo (smallest currency unit), matching Product.price.
 */

export const NIGERIAN_STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Ogun",
  "Oyo",
  "Osun",
  "Ondo",
  "Ekiti",
  "Edo",
  "Delta",
  "Rivers",
  "Bayelsa",
  "Akwa Ibom",
  "Cross River",
  "Anambra",
  "Enugu",
  "Imo",
  "Abia",
  "Ebonyi",
  "Kano",
  "Kaduna",
  "Katsina",
  "Kwara",
  "Niger",
  "Plateau",
  "Benue",
  "Nasarawa",
  "Kogi",
  "Taraba",
  "Adamawa",
  "Bauchi",
  "Gombe",
  "Borno",
  "Yobe",
  "Sokoto",
  "Kebbi",
  "Zamfara",
  "Jigawa",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

const DOOR_TO_DOOR_SURCHARGE = 70000; // ₦700, matches GIGL's flat home-delivery add-on

// Zone 0 — Lagos intra-city: same-day/next-day dispatch riders.
const ZONE_0 = new Set<string>(["Lagos"]);

// Zone 1 — neighboring South West states, shortest interstate routes.
const ZONE_1 = new Set<string>(["Ogun", "Oyo", "Osun"]);

// Zone 2 — other South West / South South major hubs + Abuja, still on
// GoFaster's 24–48hr express network.
const ZONE_2 = new Set<string>([
  "Ondo",
  "Ekiti",
  "Edo",
  "Delta",
  "Rivers",
  "Abuja (FCT)",
  "Anambra",
  "Enugu",
  "Imo",
  "Abia",
]);

// Zone 3 — everywhere else (North Central/East/West, far South South) —
// longer routes, standard 2-5 business day service.
const ZONE_FEES: Record<0 | 1 | 2 | 3, number> = {
  0: 350000, // ₦3,500
  1: 450000, // ₦4,500
  2: 650000, // ₦6,500
  3: 850000, // ₦8,500
};

function zoneFor(state: string): 0 | 1 | 2 | 3 {
  if (ZONE_0.has(state)) return 0;
  if (ZONE_1.has(state)) return 1;
  if (ZONE_2.has(state)) return 2;
  return 3; // unrecognized or far-zone state falls back to the safest (highest) tier
}

export function getShippingFee(state: string, country = "Nigeria"): number {
  if (country.trim().toLowerCase() !== "nigeria") {
    // International shipping isn't priced yet — treat as the top domestic
    // tier so checkout never silently undercharges.
    return ZONE_FEES[3] + DOOR_TO_DOOR_SURCHARGE;
  }
  return ZONE_FEES[zoneFor(state)] + DOOR_TO_DOOR_SURCHARGE;
}

export function getShippingLabel(state: string, country = "Nigeria"): string {
  if (country.trim().toLowerCase() !== "nigeria") return "International (est.)";
  const zone = zoneFor(state);
  return zone === 0 ? "Lagos same-city delivery" : "Interstate delivery (door-to-door)";
}
