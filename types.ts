export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  normalPrice: number;
  isPromo: boolean;
  promoPrice: number;
  supermarket: string;
  lastUpdate: string;
}

export interface Supermarket {
  id: string;
  name: string;
  logo: string;
  street: string;
  number: string;
  neighborhood: string;
  flyerUrl: string;
  priceIndex: number; // Novo campo vindo da planilha
  status: string; // Aberto ou Fechado
}

export interface MainBanner {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  link: string;
  imageUrl: string;
}

export interface GridBanner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  tag: string;
  imageUrl: string;
}

export interface ShoppingListItem {
  id: string;
  productName: string;
  quantity: number;
  checked: boolean;
  originalPrice: number;
  originalStore: string;
}

export interface ComparisonResult {
  storeName: string;
  logo: string;
  totalEstimated: number;
  totalConfirmed: number;
  confirmedCount: number;
  itemsCount: number;
  isBestOption: boolean;
}

export type View = 'home' | 'products' | 'stores' | 'list' | 'favorites';