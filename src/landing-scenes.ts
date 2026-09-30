export const dayParts = ["morgen", "middag", "eftermiddag", "aften"] as const;
export type DayPart = (typeof dayParts)[number];
export type SceneMode = DayPart | "auto";
export const places = ["landsbyen", "kolonihaven", "landevejen"] as const;
export type Place = (typeof places)[number];

// Scene overrides and design studies belong to the local review, never the public site.
export function landingPreviewEnabled(hostname: string, search = ""): boolean {
  return (
    ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname) &&
    new URLSearchParams(search).get("preview") !== "production"
  );
}

export function scenePreviewOptions(hostname: string, search: string) {
  const enabled = landingPreviewEnabled(hostname, search);
  return {
    enabled,
    mode: enabled ? sceneModeFromSearch(search) : ("auto" as const),
    place: enabled ? placeFromSearch(search) : null,
  };
}
export type LandscapeScene = {
  part: DayPart;
  place: Place;
  id: string;
  caption: string;
  alt: string;
};

export const dayLabels: Record<DayPart, string> = {
  morgen: "Morgen",
  middag: "Middag",
  eftermiddag: "Eftermiddag",
  aften: "Aften / nat",
};
export const dayHours: Record<DayPart, string> = {
  morgen: "05–11",
  middag: "11–15",
  eftermiddag: "15–19",
  aften: "19–05",
};
export const placeLabels: Record<Place, string> = {
  landsbyen: "Landsbyen",
  kolonihaven: "Kolonihaven",
  landevejen: "Landevejen",
};
const descriptions: Record<Place, string> = {
  landsbyen:
    "Gule huse, røde tage og stokroser på en dansk landsbygade. Pixelkastanjen sidder på en stentrappe.",
  kolonihaven:
    "En dansk kolonihave med grønt træhus, hvid låge og blomster. Pixelkastanjen sidder på en lågestolpe.",
  landevejen:
    "En snoet markvej mellem kornmarker og hvide gårde. Pixelkastanjen sidder på en hegnspæl.",
};
export function landscapeScene(part: DayPart, place: Place): LandscapeScene {
  const time = part === "aften" ? "Aften" : dayLabels[part];
  return {
    part,
    place,
    id: `${place}-${part}`,
    caption: `${time} ${place === "landevejen" ? "på" : "i"} ${place}`,
    alt: `${time}. ${descriptions[place]}`,
  };
}
export function pickPlace(
  previous?: Place | null,
  random = Math.random(),
): Place {
  const choices = places.filter((place) => place !== previous);
  return choices[
    Math.min(
      choices.length - 1,
      Math.max(0, Math.floor(random * choices.length)),
    )
  ];
}
const danishHour = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Copenhagen",
  hour: "2-digit",
  hourCycle: "h23",
});
const danishClock = new Intl.DateTimeFormat("da-DK", {
  timeZone: "Europe/Copenhagen",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export function dayPartForHour(hour: number): DayPart {
  if (hour >= 5 && hour < 11) return "morgen";
  if (hour >= 11 && hour < 15) return "middag";
  if (hour >= 15 && hour < 19) return "eftermiddag";
  return "aften";
}
export function sceneInDenmark(now: Date): DayPart {
  return dayPartForHour(Number(danishHour.format(now)));
}
export function clockInDenmark(now: Date): string {
  return danishClock.format(now);
}
export function sceneModeFromSearch(search: string): SceneMode {
  const value = new URLSearchParams(search).get("tid");
  return dayParts.find((part) => part === value) ?? "auto";
}
export function placeFromSearch(search: string): Place | null {
  const value = new URLSearchParams(search).get("sted");
  return places.find((place) => place === value) ?? null;
}
