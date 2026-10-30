export interface AstrologerData {
  id?: string;
  name: string;
  title?: string;
  specialty: string;
  experience: string;
  rating: number;
  reviews: string;
  consultations?: string;
  price: number;
  isOnline: boolean;
  languages: string;
  imageUrl: string;
  semanticLabel: string;
  category?: string;
  isFeatured?: boolean;
  isAi?: boolean;
  discount?: string | null;
  [k: string]: unknown;
}


