export type ProductStatus = "available" | "limited" | "unavailable";

export type Product = {
  id: string;
  name: string;
  category: "Vegetables" | "Fruits" | "Seedlings" | "Livestock";
  price: number;
  pricePrefix?: string;
  unit: string;
  status: ProductStatus;
  image: string;
  imageAlt?: string;
};

export const products: Product[] = [
  { id: "habanero", name: "Habanero pepper", category: "Vegetables", price: 4500, unit: "5 kg", status: "available", image: "/images/products/habanero.jpg" },
  { id: "bell-pepper", name: "Bell pepper", category: "Vegetables", price: 6000, unit: "crate", status: "available", image: "/images/products/bell-pepper.jpg" },
  { id: "cucumber", name: "Cucumber", category: "Vegetables", price: 3200, unit: "5 kg", status: "available", image: "/images/products/cucumber.jpg" },
  { id: "tomatoes", name: "Tomatoes", category: "Vegetables", price: 5500, unit: "basket", status: "limited", image: "/images/products/tomatoes.jpg" },
  { id: "watermelon", name: "Watermelon", category: "Fruits", price: 2500, unit: "piece", status: "available", image: "/images/products/watermelon.jpg" },
  { id: "plantain", name: "Plantain", category: "Fruits", price: 7500, unit: "bunch", status: "available", image: "/images/products/plantain.jpg" },
  { id: "maize", name: "Maize", category: "Vegetables", price: 18000, unit: "bag", status: "limited", image: "/images/products/maize.jpg" },
  { id: "seedlings", name: "Seedlings", category: "Seedlings", price: 500, pricePrefix: "From", unit: "seedling", status: "unavailable", image: "/images/products/seedlings.jpg" },
  { id: "snails", name: "Snails", category: "Livestock", price: 12000, unit: "1 kg", status: "available", image: "/images/products/snails.jpg" },
];

export const categories = ["All produce", "Vegetables", "Fruits", "Seedlings", "Livestock"] as const;
export type Category = (typeof categories)[number];

export const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
