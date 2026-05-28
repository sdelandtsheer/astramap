export interface ProjectedPoint {
  x: number;
  y: number;
}

export function projectRaDec(ra: number, dec: number, width: number, height: number): ProjectedPoint {
  return {
    x: (ra / 360) * width,
    y: ((90 - dec) / 180) * height,
  };
}
