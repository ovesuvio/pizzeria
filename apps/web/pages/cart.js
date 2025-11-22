import { useCart } from '../src/context/CartContext';
import Link from 'next/link';
import { useI18n } from '../src/lib/i18n';

export default function CartPage() {
  const { items, removeItem, subtotal, deliveryFee, total, mode, setMode } = useCart();
  const { t } = useI18n();

  return (
    <div>
      <h2>{t('cart.title')}</h2>
      {items.length === 0 ? (
        <p>{t('cart.empty')} <Link href="/menu">{t('cart.goMenu')}</Link></p>
      ) : (
        <>
          <div className="cart-items">
            {items.map((i, idx) => (
              <div key={idx} className="cart-item">
                <div>{i.product.name} × {i.quantity}</div>
                <div>€ {(i.product.price * i.quantity).toFixed(2)}</div>
                <button className="btn" onClick={() => removeItem(i.product._id, i.extras)}>{t('cart.remove')}</button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <div className="mode">
              <label>
                <input type="radio" name="mode" checked={mode==='pickup'} onChange={() => setMode('pickup')} /> {t('cart.mode.pickup')}
              </label>
              <label>
                <input type="radio" name="mode" checked={mode==='delivery'} onChange={() => setMode('delivery')} /> {t('cart.mode.delivery')}
              </label>
            </div>
            <div>{t('cart.subtotal')}: € {subtotal.toFixed(2)}</div>
            <div>{t('cart.deliveryFee')}: € {deliveryFee.toFixed(2)}</div>
            <div className="total">{t('cart.total')}: € {total.toFixed(2)}</div>
            <Link className="btn primary" href="/checkout">{t('cart.checkout')}</Link>
          </div>
        </>
      )}
    </div>
  );
}