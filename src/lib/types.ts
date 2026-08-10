export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string; // brand accent (hex)
  currency: string; // e.g. "د.ع"
  ordering: boolean; // does this tenant accept orders?
};

export type Variant = { id: string; name: string; price: number };
export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  variants: Variant[];
};
export type Category = { id: string; name: string; items: MenuItem[] };
export type MenuData = { restaurant: Restaurant; categories: Category[] };
