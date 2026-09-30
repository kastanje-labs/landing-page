// Original Kastanje mark: separated square pixels, a pointed shell and pale scar.
// OnlineSourdough's owner-provided grid is the visual reference; this shape is new.
export const chestnutPalette = {
  rim: "#754331",
  shell: "#a75d38",
  shade: "#8b482e",
  warm: "#c9824e",
  glint: "#e3ac73",
  scar: "#ead0a2",
  scarShade: "#c7a170",
};
const spans = [
  [8, 8],
  [6, 9],
  [4, 11],
  [3, 12],
  [2, 13],
  [1, 13],
  [1, 14],
  [0, 14],
  [0, 14],
  [0, 14],
  [0, 14],
  [1, 13],
  [1, 13],
  [2, 12],
  [3, 11],
  [5, 9],
];
export const chestnutPixels = spans.flatMap(([left, right], y) =>
  Array.from({ length: right - left + 1 }, (_, i) => {
    const x = left + i;
    const scar =
      (y === 9 && x >= 5 && x <= 8) ||
      (y === 10 && x >= 3 && x <= 10) ||
      (y === 11 && x >= 2 && x <= 11) ||
      (y === 12 && x >= 3 && x <= 10) ||
      (y === 13 && x >= 4 && x <= 9);
    const edge = x === left || x === right || y === 15;
    const glint =
      (y === 4 && x === 5) ||
      (y === 5 && x === 4) ||
      (y === 6 && x === 3) ||
      (y === 7 && x === 3);
    const warm = !edge && x < 6 && y > 2 && y < 9;
    const tone = scar
      ? y >= 12 || x >= 10
        ? "scarShade"
        : "scar"
      : glint
        ? "glint"
        : edge
          ? "rim"
          : x >= 10
            ? "shade"
            : warm
              ? "warm"
              : "shell";
    return { x: x + 0.6, y: y + 0.6, tone, color: chestnutPalette[tone] };
  }),
);
export const chestnutSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 17" width="128" height="136" shape-rendering="crispEdges"><title>Kastanje pixel chestnut</title>${chestnutPixels.map((p) => `<rect x="${p.x}" y="${p.y}" width="0.82" height="0.82" fill="${p.color}"/>`).join("")}</svg>`;
