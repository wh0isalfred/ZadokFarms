import Image from "next/image";
import type { Product } from "@/data/products";
import { formatNaira } from "@/data/products";

type ProductCardProps = {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onDecrease: () => void;
};

const statusText = {
  available: "Available to request",
  limited: "Limited",
  unavailable: "Currently unavailable",
};

export function ProductCard({ product, quantity, onAdd, onDecrease }: ProductCardProps) {
  const nurseryImage = product.id === "seedlings" && product.image === "/images/products/seedlings.jpg";
  const unavailable = product.status === "unavailable";

  return (
    <article className="product-card">
      <a className="product-image" href={`#${product.id}`} aria-label={`View ${product.name}`}>
        <Image src={nurseryImage ? "/images/products/seedlings-nursery.jpg" : product.image} alt={nurseryImage ? "Young seedlings in individual black nursery grow-bags with visible soil" : product.imageAlt ?? product.name} fill sizes="(max-width: 699px) 50vw, (max-width: 1099px) 33vw, 25vw" />
      </a>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-price">
          {product.pricePrefix && <span>{product.pricePrefix} </span>}
          <strong>{formatNaira(product.price)}</strong><span> / {product.unit}</span>
        </p>
        <p className={`product-status ${product.status}`}><span aria-hidden="true" />{statusText[product.status]}</p>
        {unavailable ? (
          <a className="product-action secondary" href={`#${product.id}`}>View details</a>
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
