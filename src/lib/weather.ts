export type Nowcast = { label: "dry" | "rain" | "easing" | "incoming"; text: string };

export type Weather = {
  ok: boolean;
  temp?: number;
  wind?: number;
  max?: number;
  min?: number;
  rainProb?: number;
  sunrise?: string; // "06:12" London
  sunset?: string; // "18:42" London
  sunsetIso?: string; // UTC ISO, for calculations
  nowcast: Nowcast;
};

/** Open-Meteo returns local-naive ISO when timezone is given — we request UTC
 *  and always append Z, so everything below is UTC; display uses Europe/London. */
const fmtLondon = (utcIso: string) =>
  new Date(utcIso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });

export async function getWeather(): Promise<Weather> {
  const nowcast: Nowcast = { label: "dry", text: "Nowcast unavailable" };
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=52.6083&longitude=1.7305" +
      "&current_weather=true" +
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset" +
      "&minutely_15=precipitation&forecast_minutely_15=48" + // next 12h, 15-min steps
      "&forecast_days=1&timezone=UTC";
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();

    // ---- Rain nowcast (15-min precipitation series) ----
    const times: string[] = j.minutely_15?.time ?? [];
    const precip: number[] = j.minutely_15?.precipitation ?? [];
    let i = times.findIndex(
      (t) => new Date(`${t}Z`).getTime() >= Date.now() - 15 * 60_000
    );
    if (i === -1) i = 0;
    const raining = (precip[i] ?? 0) > 0.1;
    if (raining) {
      let end = -1;
      for (let k = i + 1; k < precip.length - 2; k++) {
        if (precip[k] <= 0.05 && precip[k + 1] <= 0.05 && precip[k + 2] <= 0.05) {
          end = k;
          break;
        }
      }
      if (end > 0) {
        nowcast.label = "easing";
        nowcast.text = `Raining now — easing around ${fmtLondon(`${times[end]}Z`)}`;
      } else {
        nowcast.label = "rain";
        nowcast.text = "Raining now — set to continue";
      }
    } else {
      let start = -1;
      for (let k = i + 1; k < precip.length; k++) {
        if (precip[k] > 0.1) {
          start = k;
          break;
        }
      }
      if (start > 0) {
        nowcast.label = "incoming";
        nowcast.text = `Dry now — rain arriving around ${fmtLondon(`${times[start]}Z`)}`;
      } else {
        nowcast.label = "dry";
        nowcast.text = "Dry for the next 12 hours";
      }
    }

    return {
      ok: true,
      temp: j.current_weather?.temperature,
      wind: j.current_weather?.windspeed,
      max: j.daily?.temperature_2m_max?.[0],
      min: j.daily?.temperature_2m_min?.[0],
      rainProb: j.daily?.precipitation_probability_max?.[0],
      sunrise: j.daily?.sunrise?.[0] ? fmtLondon(`${j.daily.sunrise[0]}Z`) : undefined,
      sunset: j.daily?.sunset?.[0] ? fmtLondon(`${j.daily.sunset[0]}Z`) : undefined,
      sunsetIso: j.daily?.sunset?.[0] ? `${j.daily.sunset[0]}Z` : undefined,
      nowcast,
    };
  } catch {
    return { ok: false, nowcast };
  }
}
