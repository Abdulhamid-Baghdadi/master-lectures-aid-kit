// Colour cameras (Kubinger 2020, Modul 3, pp. 54–65): the Bayer pattern turned into colour, the colour space models
// HSI and HSV, and colour to grey. Channels R, G, B from 0 to 1; hue H as a fraction of a full turn (0 to 1), as the
// slides write it (1/2π·arccos …).

/** p. 63 (slide 126): I = (R + G + B)/3; S = 1 − min(R,G,B)/I, undefined when I = 0; H = 1/(2π)·arccos(((R − G) +
 *  (R − B))/(2·√((R − G)² + (R − B)(G − B)))), undefined when S is 0 or undefined, and H = 1 − H when B > G. An
 *  undefined value is null. */
export function hsi(R, G, B) {
  const I = (R + G + B) / 3;
  const S = I === 0 ? null : 1 - Math.min(R, G, B) / I;
  if (S === null || S === 0) return { H: null, S, I };
  const root = Math.sqrt((R - G) ** 2 + (R - B) * (G - B));
  // Rounding can push the cosine a hair past ±1, where arccos gives NaN.
  const cos = Math.max(-1, Math.min(1, ((R - G) + (R - B)) / (2 * root)));
  let H = Math.acos(cos) / (2 * Math.PI);
  if (B > G) H = 1 - H;
  return { H, S, I };
}

/** p. 64 (slide 128): V = max(R,G,B), Δ = V − min(R,G,B), S = Δ/V (undefined when V = 0); H = (G − B)/(6Δ) when R is
 *  the largest, ((B − R)/Δ + 2)/6 when G is, ((R − G)/Δ + 4)/6 when B is, plus 1 when below 0. */
export function hsv(R, G, B) {
  const V = Math.max(R, G, B), D = V - Math.min(R, G, B);
  const S = V === 0 ? null : D / V;
  if (S === null || S === 0) return { H: null, S, V };
  let H = R === V ? (G - B) / (6 * D) : G === V ? ((B - R) / D + 2) / 6 : ((R - G) / D + 4) / 6;
  if (H < 0) H += 1;
  return { H, S, V };
}

/** p. 65 (slide 130): grey with more weight on green, Y = 0.299R + 0.587G + 0.114B, or all three alike, I = (R+G+B)/3. */
export const luma = (R, G, B) => 0.299 * R + 0.587 * G + 0.114 * B;
export const meanGrey = (R, G, B) => (R + G + B) / 3;

/** p. 58 (slide 116): the primary Bayer filter's 2 × 2 cell, R at (u, v), G at (u+1, v) and (u, v+1), B at
 *  (u+1, v+1): R = R(u,v), G = ½(G(u+1,v) + G(u,v+1)), B = B(u+1,v+1). */
export const bayerPrimary = ({ R, G1, G2, B }) => [R, (G1 + G2) / 2, B];

/** p. 59 (slide 117): the complementary filter, CY = G + B at (u, v), YE = R + G at (u+1, v), G at (u, v+1) and
 *  (u+1, v+1): R = YE − ½(G + G), G = ½(G + G), B = CY − ½(G + G). */
export const bayerComplementary = ({ CY, YE, G1, G2 }) => [YE - (G1 + G2) / 2, (G1 + G2) / 2, CY - (G1 + G2) / 2];

/** What each filter cell would read for a uniform patch of colour R, G, B: the input of the two functions above.
 *  The complementary filters pass the sums the slide names (p. 57, slide 114: CY = G + B, YE = R + G). */
export const primaryCell = (R, G, B) => ({ R, G1: G, G2: G, B });
export const complementaryCell = (R, G, B) => ({ CY: G + B, YE: R + G, G1: G, G2: G });
