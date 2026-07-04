import type { StaticImageData } from "next/image";
import blogo1 from "./images/blogo1.png";
import blogo2 from "./images/blogo2.png";
import blogo3 from "./images/blogo3.png";
import blogo4 from "./images/blogo4.png";
import blogo5 from "./images/blogo5.png";
import blogo6 from "./images/blogo6.png";

export const BRAND_LOGOS: StaticImageData[] = [
  blogo1,
  blogo2,
  blogo3,
  blogo4,
  blogo5,
  blogo6,
];

/**
 * 3×3 bento — DOM order matches grid auto-flow.
 * blogo4 sits in the wide `col-span-2` landscape slot (row 2).
 */
export const HERO_LOGO_TILES: {
  logo: StaticImageData;
  className: string;
  label: string;
}[] = [
  { logo: blogo1, className: "col-span-1 row-span-1", label: "Brand partner 1" },
  { logo: blogo2, className: "col-span-1 row-span-1", label: "Brand partner 2" },
  { logo: blogo3, className: "col-span-1 row-span-2", label: "Brand partner 3" },
  { logo: blogo4, className: "col-span-2 row-span-1", label: "Brand partner 4" },
  { logo: blogo5, className: "col-span-1 row-span-1", label: "Brand partner 5" },
  { logo: blogo6, className: "col-span-1 row-span-1", label: "Brand partner 6" },
];
