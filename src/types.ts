export interface Car {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  body_type: string;
  engine: string;
  transmission: string;
  fuel_type: string;
  horsepower: number;
  torque: number;
  seating_capacity: number;
  drivetrain: string;
  description: string;
  image_url: string;
  created_at: string;
}

export interface Dealership {
  id: string;
  name: string;
  location: string;
  rating: number;
  phone: string;
  website: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  car_id: string;
  dealership_id: string;
  price: number;
  mileage: number;
  condition_status: string;
  availability: string;
  created_at: string;
  dealership?: Dealership;
}

export interface CarWithListings extends Car {
  listings?: Listing[];
}
