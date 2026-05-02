export type VehicleType = 'motorcycle' | 'car';
export type FuelType = 'petrol' | 'diesel';
export type DocumentType = 'insurance' | 'registration' | 'license' | 'other';
export type Language = 'en' | 'ne';
export type Theme = 'light' | 'dark';

export interface Vehicle {
  id: string;
  ownerId: string;
  name: string;
  type: VehicleType;
  fuelType: FuelType;
  model: string;
  make: string;
  year: number;
  initialOdometer: number;
  currentOdometer: number;
  createdAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  userId: string;
  date: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  isFullTank: boolean;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  userId: string;
  date: string;
  type: string;
  odometer: number;
  cost: number;
  notes: string;
  nextServiceOdometer?: number;
  nextServiceDate?: string;
  businessName?: string;
  placeOfMaintenance?: string;
}

export interface VehicleDocument {
  id: string;
  vehicleId?: string;
  userId: string;
  title: string;
  type: DocumentType;
  expiryDate: string;
  reminderDays: number;
  fileUrl?: string; // For image/PDF proof
}

export interface AnalyticsSummary {
  averageMileage: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  costPerKm: number;
  trend: { date: string; mileage: number }[];
}
