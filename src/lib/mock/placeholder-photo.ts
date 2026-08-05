const PALETTE = ["#f4a89f", "#f6c6a0", "#a8d8c9", "#a9c9e6", "#c9b8e6", "#f0c9dd"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Retrato mockado (sem upload real ainda) — SVG local, sem dependência de rede. */
export function placeholderPhoto(name: string, index = 0) {
  const color = PALETTE[index % PALETTE.length];
  const initials = initialsOf(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640"><rect width="480" height="640" fill="${color}"/><text x="240" y="340" font-family="system-ui, sans-serif" font-size="160" font-weight="600" fill="rgba(0,0,0,0.35)" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
