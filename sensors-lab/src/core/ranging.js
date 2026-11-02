// Ranging by an echo's time of flight (ultrasound, RADAR, LIDAR) and by the phase of modulated light (the ToF
// camera), and the data an imaging sensor sends (Kubinger 2020, Modul 2 and 3). SI units: m, s, Hz, bytes, bit/s.
// Pages are the PDF pages of ASENS_WS2020_Folien_v1_2Seiten.pdf, two slides to a page.

/** The speed of light, exact by the SI definition of the metre. */
export const C_LIGHT = 299792458;

/** p. 9 (slide 17): the speed of sound c0 = 331.6 m/s; the slide adds that it changes with temperature, humidity and
 *  air pressure. */
export const C_SOUND = 331.6;

/** The echo travels out and back, so the distance is half the path. The slides state it for light in the ToF formula
 *  (p. 77: d = c·φ/(4π·fmod), where φ/(2π·fmod) is the round-trip time); the same holds for sound. */
export const echoDistance = (c, t) => c * t / 2;
export const echoTime = (c, d) => 2 * d / c;

/** p. 77 (slide 154): φ = arctan((A1 − A3)/(A2 − A4)). Taken with both signs (atan2), so φ covers the whole turn
 *  0 to 2π; the slide's plain arctan covers half of it. */
export function tofPhase(A1, A2, A3, A4) {
  const phi = Math.atan2(A1 - A3, A2 - A4);
  return phi < 0 ? phi + 2 * Math.PI : phi;
}

/** p. 77: d = c·φ/(4π·fmod). */
export const tofDistance = (phi, fmod) => C_LIGHT * phi / (4 * Math.PI * fmod);

/** p. 78 (slide 156): λmod = c/fmod, and the largest distance before the phase wraps, dmax = λmod/2. */
export const modWavelength = fmod => C_LIGHT / fmod;
export const tofRange = fmod => modWavelength(fmod) / 2;

/** Four samples of the returned light, a quarter period apart, chosen here so that A1 − A3 ∝ sin φ and A2 − A4 ∝ cos φ
 *  and the slide's formula gives φ back; an offset B (ambient light) cancels in both differences. The pixel's own
 *  sampling is not drawn in the slides' text, so this is a model, not the PMD sensor's circuit. */
export function tofSamples(d, fmod, a = 1, B = 1) {
  const phi = (4 * Math.PI * fmod * d / C_LIGHT) % (2 * Math.PI);
  return [B + a * Math.sin(phi), B + a * Math.cos(phi), B - a * Math.sin(phi), B - a * Math.cos(phi)];
}

/** The distance the camera reports: true distance folded back into 0 … dmax (the phase wraps every λmod/2). */
export const tofReported = (d, fmod) => tofDistance(tofPhase(...tofSamples(d, fmod)), fmod);

/** An image's size in bytes: width × height pixels × bytes per pixel (MC Teil 1, Frage 2; p. 35, slide 70). */
export const imageBytes = (w, h, bytesPerPixel) => w * h * bytesPerPixel;

/** The stream in bit/s: bytes per image × images per second × 8 (p. 35: 800 × 600 colour at 25 per second, "ca.
 *  290 MBit/Sekunde"). */
export const dataRate = (w, h, bytesPerPixel, fps) => imageBytes(w, h, bytesPerPixel) * fps * 8;
