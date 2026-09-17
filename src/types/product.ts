export interface ProductListItem {
  _id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  ratingAverage: number;
  ratingCount: number;
  attributes: Record<string, string>;
  collections?: { title: string; slug: string }[];
}
