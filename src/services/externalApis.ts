// src/services/externalApis.ts
import axios from "axios";
import type {
  GenderizeResponse,
  AgifyResponse,
  NationalizeResponse,
} from "../types/index.js";

// Helper — creates a consistent error for edge cases
const makeApiError = (apiName: string): Error => {
  const err = new Error(`${apiName} returned an invalid response`) as any;
  err.statusCode = 502;
  err.isApiError = true;
  return err;
};

export const fetchAllApis = async (name: string) => {
  const encodedName = encodeURIComponent(name);

  // Promise.all fires all 3 requests at the SAME TIME
  // Instead of: call Genderize → wait → call Agify → wait → call Nationalize
  // We do: call all three → wait for all three to finish
  // This is faster — total wait time = slowest API, not sum of all three
  const [genderizeRes, agifyRes, nationalizeRes] = await Promise.all([
    axios.get<GenderizeResponse>(
      `https://api.genderize.io?name=${encodedName}`,
      { timeout: 4500 },
    ),
    axios.get<AgifyResponse>(`https://api.agify.io?name=${encodedName}`, {
      timeout: 4500,
    }),
    axios.get<NationalizeResponse>(
      `https://api.nationalize.io?name=${encodedName}`,
      { timeout: 4500 },
    ),
  ]);

  const genderData = genderizeRes.data;
  const agifyData = agifyRes.data;
  const nationalizeData = nationalizeRes.data;

  // Edge case checks — if any API returns invalid data
  // do NOT store anything, return 502 immediately
  if (genderData.gender === null || genderData.count === 0) {
    throw makeApiError("Genderize");
  }

  if (agifyData.age === null) {
    throw makeApiError("Agify");
  }

  if (!nationalizeData.country || nationalizeData.country.length === 0) {
    throw makeApiError("Nationalize");
  }

  // Pick the country with the highest probability
  // sort() sorts the array — we sort descending by probability
  // [0] picks the first item — which is now the highest
  const topCountry = nationalizeData.country.sort(
    (a, b) => b.probability - a.probability,
  )[0];

  // Safety check — topCountry should always exist after the check above
  // but TypeScript needs us to be explicit
  if (!topCountry) {
    throw makeApiError("Nationalize");
  }

  return {
    gender: genderData.gender,
    gender_probability: genderData.probability,
    sample_size: genderData.count,
    age: agifyData.age,
    age_group: classifyAgeInline(agifyData.age),
    country_id: topCountry.country_id,
    country_probability: topCountry.probability,
  };
};

// Inline helper to avoid circular imports
const classifyAgeInline = (age: number): string => {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
};
