import vehiclesData from "@/data/vehicles.json";

export type VehicleImage = { label: string; file: string; depthFile?: string };

export type Vehicle = {
  lotNumber: number;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  condition: string | null;
  damage: string | null;
  odometer: number | null;
  location: string | null;
  bodyStyle: string | null;
  vehicleCategory: string | null;
  images: VehicleImage[];
  rotationOrder: string[];
  fetchedAt: string;
};

export function getVehicles(): Vehicle[] {
  return vehiclesData as Vehicle[];
}

export function getVehicle(lotNumber: number): Vehicle | undefined {
  return getVehicles().find((v) => v.lotNumber === lotNumber);
}
