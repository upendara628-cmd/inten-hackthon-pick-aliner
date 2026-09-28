export type RatioKey = "idcard" | "linkedin" | "instagram";

export interface RatioDef {
  key: RatioKey;
  label: string;
  hint: string;
  /** aspect = width / height */
  aspect: number;
  /** export resolution */
  exportWidth: number;
  exportHeight: number;
}

export const RATIOS: RatioDef[] = [
  {
    key: "idcard",
    label: "ID Card",
    hint: "CR80 · 2.125 : 3.375",
    aspect: 2.125 / 3.375,
    exportWidth: 1275,
    exportHeight: 2025,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    hint: "Banner · 1.91 : 1",
    aspect: 1.91,
    exportWidth: 1910,
    exportHeight: 1000,
  },
  {
    key: "instagram",
    label: "Instagram",
    hint: "Square · 1 : 1",
    aspect: 1,
    exportWidth: 1500,
    exportHeight: 1500,
  },
];

export const getRatio = (key: RatioKey) => RATIOS.find((r) => r.key === key)!;
