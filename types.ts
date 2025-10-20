export type View = 'products' | 'locations' | 'analytics' | 'search';

export type Language = 'ar' | 'fr' | 'de';

export type MultilingualString = {
  [key in Language]: string;
};

export interface Product {
  id: number;
  name: MultilingualString;
  category: MultilingualString;
  description: MultilingualString;
  barcode: string;
  price: number;
  stock: number;
  locationId: number;
  imageUrl: string;
}

export interface Location {
  id: number;
  floor: number;
  aisle: number;
  shelf: number;
  bin: number;
}

export interface AnalyticsData {
  topSearches: { term: string; count: number }[];
  peakTimes: { hour: string; searches: number }[];
  missingItems: { productId: number; reportCount: number }[];
}

export type Translations = {
  [key: string]: string;
};
