import Image from "next/image";
import type { Product } from "@/data/products";
import { formatNaira } from "@/data/products";

type ProductCardProps = {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onDecrease: () => void;
};

// Versioned replacements avoid stale optimized images; custom catalogue images stay authoritative.
const harvestImages: Record<string, string> = {
  "/images/products/habanero.jpg": "/images/products/habanero-harvest.jpg",
  "/images/products/bell-pepper.jpg": "/images/products/bell-pepper-harvest.jpg",
  "/images/products/cucumber.jpg": "/images/products/cucumber-harvest.jpg",
  "/images/products/tomatoes.jpg": "/images/products/tomatoes-harvest.jpg",
};

const statusText = {
  available: "Available to request",
  limited: "Limited",
  unavailable: "Currently unavailable",
};

export function ProductCard({ product, quantity, onAdd, onDecrease }: ProductCardProps) {
  const unavailable = product.status === "unavailable";

  return (
    <article className="product-card">
      <div className="product-image">
        <Image src={harvestImages[product.image] ?? product.image} alt={product.imageAlt ?? product.name} fill sizes="(max-width: 1099px) 50vw, (max-width: 1720px) 25vw, 400px" />
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-price">
          {product.pricePrefix && <span>{product.pricePrefix} </span>}
          <strong>{formatNaira(product.price)}</strong><span> / {product.unit}</span>
        </p>
        <p className={`product-status ${product.status}`}><span aria-hidden="true" />{statusText[product.status]}</p>
        {unavailable ? (
          <span className="product-action secondary unavailable-action">Not available to request</span>
        ) : quantity > 0 ? (
          <div className="quantity-control" aria-label={`${product.name} quantity`}>
            <button type="button" onClick={onDecrease} aria-label={`Remove one ${product.name}`}>−</button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" onClick={onAdd} aria-label={`Add another ${product.name}`}>+</button>
          </div>
        ) : (
          <button className="product-action" type="button" onClick={onAdd}>Add to basket</button>
        )}
      </div>
    </article>
  );
}
