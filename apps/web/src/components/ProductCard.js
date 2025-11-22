import { useI18n } from '../lib/i18n';

export default function ProductCard({ product, onAdd }) {
  const { t } = useI18n();
  return (
    <div className="card">
      {product.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.photoUrl} alt={product.name} className="card-img" />
      )}
      <div className="card-body">
        <div className="card-title">{product.name}</div>
        <div className="card-desc">{product.description}</div>
        <div className="card-meta">
          <span className="price">€ {product.price.toFixed(2)}</span>
          <span className={product.available ? 'available' : 'soldout'}>
            {product.available ? t('product.available') : t('product.soldout')}
          </span>
        </div>
        <button
          className="btn"
          disabled={!product.available}
          onClick={() => onAdd(product)}
        >
          {t('product.add')}
        </button>
      </div>
    </div>
  );
}