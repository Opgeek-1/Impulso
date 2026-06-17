export type VersionEntry = {
  version: string;
  date: string;
  changeKeys: string[];
};

export const VERSION_LOG: VersionEntry[] = [
  {
    version: "1.2.0",
    date: "2026-06-16",
    changeKeys: ["v1_2_0_a", "v1_2_0_b", "v1_2_0_c"],
  },
  {
    version: "1.1.0",
    date: "2026-06-10",
    changeKeys: ["v1_1_0_a", "v1_1_0_b", "v1_1_0_c", "v1_1_0_d"],
  },
  {
    version: "1.0.0",
    date: "2026-06-01",
    changeKeys: ["v1_0_0_a", "v1_0_0_b", "v1_0_0_c", "v1_0_0_d", "v1_0_0_e"],
  },
];
