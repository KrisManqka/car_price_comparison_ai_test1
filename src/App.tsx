import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  Car as CarIcon,
  Gauge,
  Fuel,
  Cog,
  Users,
  Settings2,
  Zap,
  MapPin,
  Star,
  Phone,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Calendar,
  CarFront,
  ChevronDown,
  Sparkles,
  Tag,
  Award,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CarWithListings, Listing } from '@/types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatMileage(km: number): string {
  return new Intl.NumberFormat('bg-BG').format(km) + ' km';
}

const mobileBgMakeSlug: Record<string, string> = {
  'Audi': 'audi',
  'BMW': 'bmw',
  'Chevrolet': 'chevrolet',
  'Citroen': 'citroen',
  'Dacia': 'dacia',
  'Fiat': 'fiat',
  'Ford': 'ford',
  'Honda': 'honda',
  'Hyundai': 'hyundai',
  'Jeep': 'jeep',
  'Kia': 'kia',
  'Mazda': 'mazda',
  'Mercedes-Benz': 'mercedes-benz',
  'Nissan': 'nissan',
  'Opel': 'opel',
  'Peugeot': 'peugeot',
  'Porsche': 'porsche',
  'Renault': 'renault',
  'Skoda': 'skoda',
  'Tesla': 'tesla',
  'Toyota': 'toyota',
  'Volkswagen': 'vw',
};

function getMobileBgSearchUrl(make: string): string {
  const slug = mobileBgMakeSlug[make] ?? make.toLowerCase().replace(/\s+/g, '-');
  return `https://www.mobile.bg/obiavi/avtomobili-dzhipove/${slug}`;
}

const conditionColors: Record<string, string> = {
  New: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Certified Pre-Owned': 'bg-sky-100 text-sky-700 border-sky-200',
  Used: 'bg-amber-100 text-amber-700 border-amber-200',
};

const availabilityStyles: Record<string, string> = {
  'In Stock': 'text-emerald-600',
  'On Order': 'text-amber-600',
};

function getYearColor(year: number): string {
  if (year < 2000) return 'bg-rose-500/90 text-white';
  if (year < 2005) return 'bg-orange-500/90 text-white';
  if (year < 2010) return 'bg-amber-500/90 text-white';
  if (year < 2015) return 'bg-lime-500/90 text-white';
  if (year < 2020) return 'bg-teal-500/90 text-white';
  if (year < 2023) return 'bg-cyan-500/90 text-white';
  return 'bg-indigo-500/90 text-white';
}

function getBodyTypeColor(bodyType: string): string {
  const map: Record<string, string> = {
    SUV: 'bg-orange-100 text-orange-700 border-orange-200',
    Sedan: 'bg-blue-100 text-blue-700 border-blue-200',
    Hatchback: 'bg-purple-100 text-purple-700 border-purple-200',
    Coupe: 'bg-rose-100 text-rose-700 border-rose-200',
    Truck: 'bg-amber-100 text-amber-700 border-amber-200',
    Wagon: 'bg-teal-100 text-teal-700 border-teal-200',
  };
  return map[bodyType] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function App() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<CarWithListings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [allCars, setAllCars] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'rating'>('price-low');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from('cars')
      .select('name')
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) {
          setAllCars(data.map((c) => c.name));
        }
      });
  }, []);

  const filteredSuggestions = searchTerm
    ? allCars
        .filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 6)
    : [];

  const handleSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setShowSuggestions(false);

    try {
      const { data, error: fetchError } = await supabase
        .from('cars')
        .select(
          `
          *,
          listings (
            *,
            dealership:dealerships (*)
          )
        `
        )
        .ilike('name', `%${trimmed}%`)
        .order('name');

      if (fetchError) throw fetchError;
      setResults((data as CarWithListings[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSuggestionClick = (name: string) => {
    setQuery(name);
    setSearchTerm(name);
    setShowSuggestions(false);
    handleSearch(name);
  };

  const sortListings = (listings: Listing[]): Listing[] => {
    const sorted = [...listings];
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.dealership?.rating || 0) - (a.dealership?.rating || 0));
    }
    return sorted;
  };

  const getBestPrice = (listings: Listing[] | undefined): number | null => {
    if (!listings || listings.length === 0) return null;
    return Math.min(...listings.map((l) => l.price));
  };

  const getAvgPrice = (listings: Listing[] | undefined): number | null => {
    if (!listings || listings.length === 0) return null;
    const total = listings.reduce((sum, l) => sum + l.price, 0);
    return Math.round(total / listings.length);
  };

  const priceRange = (listings: Listing[] | undefined): { low: number; high: number } | null => {
    if (!listings || listings.length === 0) return null;
    const prices = listings.map((l) => l.price);
    return { low: Math.min(...prices), high: Math.max(...prices) };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                CarCompare
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">
                Find your car. Compare prices from sellers across Bulgaria.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-blue-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search for a car — e.g. Toyota Camry, BMW M3, Dacia Sandero..."
                className="w-full pl-12 pr-12 py-3.5 text-sm bg-blue-50/50 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSearchTerm('');
                    setResults([]);
                    setHasSearched(false);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50">
                {filteredSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSuggestionClick(name)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <CarFront className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-slate-700">{name}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Searching sellers...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <X className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">
              Couldn't load results
            </p>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={() => handleSearch(query)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">
              No cars found for "{query}"
            </p>
            <p className="text-sm text-slate-500">
              Try a different name or check the spelling.
            </p>
          </div>
        )}

        {/* Initial State (before any search) */}
        {!loading && !error && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-5 shadow-xl shadow-blue-500/20">
              <CarIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Search any car to compare prices
            </h2>
            <p className="text-sm text-slate-500 max-w-md mb-8">
              Type a car name above to see full specifications and prices
              from sellers across Bulgaria, side by side.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {allCars.slice(0, 12).map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setQuery(name);
                    handleSearch(name);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-full hover:border-blue-400 hover:bg-blue-50 transition-all hover:shadow-sm"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results.length > 0 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-500">
              {results.length} {results.length === 1 ? 'car' : 'cars'} found
              {query && (
                <>
                  {' '}for <span className="font-medium text-slate-700">"{query}"</span>
                </>
              )}
            </p>

            {results.map((car) => {
              const bestPrice = getBestPrice(car.listings);
              const avgPrice = getAvgPrice(car.listings);
              const range = priceRange(car.listings);
              const sortedListings = sortListings(car.listings);

              return (
                <div
                  key={car.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Car Header: Image + Details */}
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="relative md:w-2/5 h-56 md:h-auto min-h-[280px] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                      <img
                        src={car.image_url}
                        alt={car.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold backdrop-blur rounded-md ${getYearColor(car.year)}`}>
                          {car.year}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-semibold border rounded-md ${getBodyTypeColor(car.body_type)}`}>
                          {car.body_type}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-6 md:p-7">
                      <div className="mb-4">
                        <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">
                          {car.make}
                        </p>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                          {car.model}
                        </h2>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed mb-5">
                        {car.description}
                      </p>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <SpecItem
                          icon={<Gauge className="w-4 h-4" />}
                          label="Horsepower"
                          value={`${car.horsepower} hp`}
                          color="text-rose-500 bg-rose-50"
                        />
                        <SpecItem
                          icon={<Zap className="w-4 h-4" />}
                          label="Torque"
                          value={`${car.torque} lb-ft`}
                          color="text-amber-500 bg-amber-50"
                        />
                        <SpecItem
                          icon={<Fuel className="w-4 h-4" />}
                          label="Fuel"
                          value={car.fuel_type}
                          color="text-emerald-500 bg-emerald-50"
                        />
                        <SpecItem
                          icon={<Cog className="w-4 h-4" />}
                          label="Transmission"
                          value={car.transmission}
                          color="text-purple-500 bg-purple-50"
                        />
                        <SpecItem
                          icon={<Users className="w-4 h-4" />}
                          label="Seats"
                          value={`${car.seating_capacity}`}
                          color="text-blue-500 bg-blue-50"
                        />
                        <SpecItem
                          icon={<Settings2 className="w-4 h-4" />}
                          label="Drivetrain"
                          value={car.drivetrain}
                          color="text-teal-500 bg-teal-50"
                        />
                        <SpecItem
                          icon={<CarFront className="w-4 h-4" />}
                          label="Engine"
                          value={car.engine}
                          color="text-indigo-500 bg-indigo-50"
                        />
                        <SpecItem
                          icon={<Calendar className="w-4 h-4" />}
                          label="Year"
                          value={`${car.year}`}
                          color="text-cyan-500 bg-cyan-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price Summary Bar */}
                  {bestPrice && avgPrice && range && (
                    <div className="grid grid-cols-3 gap-px bg-slate-100 border-t border-slate-200">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 mb-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          Best Price
                        </div>
                        <p className="text-xl font-bold text-emerald-900">
                          {formatPrice(bestPrice)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 mb-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Average
                        </div>
                        <p className="text-xl font-bold text-blue-900">
                          {formatPrice(avgPrice)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 mb-1">
                          <Tag className="w-3.5 h-3.5" />
                          Price Range
                        </div>
                        <p className="text-sm font-bold text-purple-900 pt-1">
                          {formatPrice(range.low)} – {formatPrice(range.high)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dealership Listings */}
                  {sortedListings && sortedListings.length > 0 && (
                    <div className="border-t border-slate-200">
                      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/30">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <Award className="w-4 h-4 text-blue-500" />
                          Seller Prices
                          <span className="ml-1 text-slate-400 font-normal">
                            ({sortedListings.length} {sortedListings.length === 1 ? 'offer' : 'offers'})
                          </span>
                        </h3>
                        <div className="relative">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'price-low' | 'price-high' | 'rating')}
                            className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Dealer Rating</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {sortedListings.map((listing, idx) => {
                          const isBest = listing.price === bestPrice;
                          return (
                            <div
                              key={listing.id}
                              className={`flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 transition-colors hover:bg-blue-50/30 ${
                                isBest ? 'bg-emerald-50/40' : ''
                              }`}
                            >
                              {/* Dealer Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-slate-900 truncate">
                                    {listing.dealership?.name}
                                  </span>
                                  {isBest && (
                                    <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full uppercase tracking-wide flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Best Deal
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-blue-400" />
                                    {listing.dealership?.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    {listing.dealership?.rating.toFixed(1)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-400" />
                                    {listing.dealership?.phone}
                                  </span>
                                </div>
                              </div>

                              {/* Listing Details */}
                              <div className="flex items-center gap-4 sm:gap-6">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 text-[11px] font-medium rounded-md border ${
                                      conditionColors[listing.condition_status] ||
                                      'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {listing.condition_status}
                                  </span>
                                  {listing.mileage > 0 && (
                                    <span className="text-xs text-slate-500">
                                      {formatMileage(listing.mileage)}
                                    </span>
                                  )}
                                  <span
                                    className={`flex items-center gap-1 text-xs font-medium ${
                                      availabilityStyles[listing.availability] ||
                                      'text-slate-500'
                                    }`}
                                  >
                                    {listing.availability === 'In Stock' ? (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5" />
                                    )}
                                    {listing.availability}
                                  </span>
                                </div>

                                {/* Price + Link */}
                                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                                  <div className="text-right">
                                    <p
                                      className={`text-lg font-bold ${
                                        isBest ? 'text-emerald-700' : 'text-slate-900'
                                      }`}
                                    >
                                      {formatPrice(listing.price)}
                                    </p>
                                    {idx === 0 && sortBy === 'price-low' && sortedListings.length > 1 && (
                                      <p className="text-[10px] text-emerald-600 font-medium">
                                        Save {formatPrice((sortedListings[sortedListings.length - 1].price) - listing.price)}
                                      </p>
                                    )}
                                  </div>
                                  {(
                                    <a
                                      href={getMobileBgSearchUrl(car.make)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                                        isBest
                                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20'
                                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20'
                                      }`}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      View Listing
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No Listings */}
                  {(!car.listings || car.listings.length === 0) && (
                    <div className="border-t border-slate-200 px-6 py-8 text-center">
                      <p className="text-sm text-slate-500">
                        No listings available for this car yet.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 bg-gradient-to-r from-slate-50 to-blue-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs text-slate-400 text-center">
            CarCompare — Compare car prices from sellers on mobile.bg across Bulgaria.
            Prices are sample data for demonstration.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SpecItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${color} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
