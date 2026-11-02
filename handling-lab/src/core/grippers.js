// Vacuum and magnet grippers (Berger 2021, chapter 3, section 3.4.5). Pressures in Pa, areas in m², forces in N.

export const MU0 = 4e-7 * Math.PI;

/** Ch. 3, p. 60: the air pressure falls by 12.5 mbar for every 100 m of height, from 1013 mbar at sea level. */
export const airPressure = height => 101300 - 1250 * height / 100;

/** Ch. 3, p. 62: F = (po − pu)·A·n3·η·z·S⁻¹, po the outside air pressure, pu the absolute pressure in the cup, A one
 *  cup's area, n3 the deformation factor (0.9 to 0.6), η the efficiency, z the cups, S the safety factor (2 to 3). */
export const suctionForce = ({ po, pu, A, n3, eta, z, S }) => (po - pu) * A * n3 * eta * z / S;

/** A round cup's area from its diameter. */
export const cupArea = d => Math.PI * d * d / 4;

/** Ch. 3, p. 69: the magnet's holding force Fh = A·B²/(2μ0)·(1 − 1/μr), B in tesla (the slide prints henry, which is
 *  the unit of inductance, not of flux density), A in m². */
export const magnetForce = ({ A, B, mur }) => A * B * B / (2 * MU0) * (1 - 1 / mur);
