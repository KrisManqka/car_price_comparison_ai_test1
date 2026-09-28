/*
# Car Comparison Schema (single-tenant, no auth)

1. New Tables
- `cars` — stores car models with full specifications and an image.
  - id (uuid PK)
  - name (text, unique) — the searchable car name (e.g. "Toyota Camry 2024")
  - make (text)
  - model (text)
  - year (int)
  - body_type (text) — e.g. Sedan, SUV, Truck
  - engine (text) — e.g. "2.5L I4"
  - transmission (text) — e.g. "8-Speed Automatic"
  - fuel_type (text) — e.g. Gasoline, Hybrid, Electric
  - horsepower (int)
  - torque (int) — lb-ft
  - seating_capacity (int)
  - drivetrain (text) — e.g. FWD, AWD, RWD
  - description (text)
  - image_url (text)
  - created_at (timestamptz)

- `dealerships` — stores dealership info.
  - id (uuid PK)
  - name (text)
  - location (text)
  - rating (numeric, 0-5)
  - phone (text)
  - created_at (timestamptz)

- `listings` — links cars to dealerships with a price and condition.
  - id (uuid PK)
  - car_id (uuid FK → cars)
  - dealership_id (uuid FK → dealerships)
  - price (numeric) — in USD
  - mileage (int) — miles
  - condition_status (text) — New, Certified Pre-Owned, Used
  - availability (text) — In Stock, On Order
  - created_at (timestamptz)

2. Indexes
- Index on `cars(name)` for search.
- Index on `listings(car_id)` for join lookups.
- Index on `listings(dealership_id)`.

3. Security
- RLS enabled on all three tables.
- All tables are intentionally public/shared (single-tenant, no auth).
- CRUD policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`.
*/

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year int NOT NULL,
  body_type text NOT NULL,
  engine text NOT NULL,
  transmission text NOT NULL,
  fuel_type text NOT NULL,
  horsepower int NOT NULL,
  torque int NOT NULL,
  seating_capacity int NOT NULL,
  drivetrain text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Dealerships table
CREATE TABLE IF NOT EXISTS dealerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  dealership_id uuid NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL,
  mileage int NOT NULL DEFAULT 0,
  condition_status text NOT NULL DEFAULT 'New',
  availability text NOT NULL DEFAULT 'In Stock',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cars_name ON cars (name);
CREATE INDEX IF NOT EXISTS idx_listings_car_id ON listings (car_id);
CREATE INDEX IF NOT EXISTS idx_listings_dealership_id ON listings (dealership_id);

-- Enable RLS
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Cars policies (public/shared data)
DROP POLICY IF EXISTS "anon_select_cars" ON cars;
CREATE POLICY "anon_select_cars" ON cars FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cars" ON cars;
CREATE POLICY "anon_insert_cars" ON cars FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cars" ON cars;
CREATE POLICY "anon_update_cars" ON cars FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cars" ON cars;
CREATE POLICY "anon_delete_cars" ON cars FOR DELETE
  TO anon, authenticated USING (true);

-- Dealerships policies
DROP POLICY IF EXISTS "anon_select_dealerships" ON dealerships;
CREATE POLICY "anon_select_dealerships" ON dealerships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_dealerships" ON dealerships;
CREATE POLICY "anon_insert_dealerships" ON dealerships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_dealerships" ON dealerships;
CREATE POLICY "anon_update_dealerships" ON dealerships FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_dealerships" ON dealerships;
CREATE POLICY "anon_delete_dealerships" ON dealerships FOR DELETE
  TO anon, authenticated USING (true);

-- Listings policies
DROP POLICY IF EXISTS "anon_select_listings" ON listings;
CREATE POLICY "anon_select_listings" ON listings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_listings" ON listings;
CREATE POLICY "anon_insert_listings" ON listings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_listings" ON listings;
CREATE POLICY "anon_update_listings" ON listings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_listings" ON listings;
CREATE POLICY "anon_delete_listings" ON listings FOR DELETE
  TO anon, authenticated USING (true);
