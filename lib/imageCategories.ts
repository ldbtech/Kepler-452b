import type { Vehicle, VehicleImage } from "@/lib/vehicles";

export type ImageCategory = "Exterior" | "Interior" | "Undercarriage" | "Mechanical" | "Damage";

const CATEGORY_LABELS: Record<string, ImageCategory> = {
  DIRF: "Interior",
  CKPT: "Interior",
  ODOM: "Interior",
  ENGN: "Mechanical",
  DENT: "Damage",
};

export function imagesByCategory(vehicle: Vehicle): Record<ImageCategory, VehicleImage[]> {
  const buckets: Record<ImageCategory, VehicleImage[]> = {
    Exterior: [],
    Interior: [],
    Undercarriage: [],
    Mechanical: [],
    Damage: [],
  };

  for (const img of vehicle.images) {
    if (vehicle.rotationOrder.includes(img.label)) {
      buckets.Exterior.push(img);
      continue;
    }
    const category = CATEGORY_LABELS[img.label];
    if (category) buckets[category].push(img);
  }

  return buckets;
}
