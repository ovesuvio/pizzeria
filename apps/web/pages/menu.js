import useSWR from 'swr';
import { apiGet, API_BASE } from '../src/lib/api';
import { useCart } from '../src/context/CartContext';
import ProductCard from '../src/components/ProductCard';
import { useI18n } from '../src/lib/i18n';
import { useMemo, useState } from 'react';

export default function MenuPage({ initialCategories = null, initialProducts = null }) {
  const { t } = useI18n();
  const { data: categories } = useSWR('/categories', apiGet, { fallbackData: initialCategories });
  const { data: products } = useSWR('/products', apiGet, { fallbackData: initialProducts });
  const { addItem } = useCart();
  const [active, setActive] = useState('Pizza');

  // Raggruppa per categoria → sottocategoria
  const grouped = (products || []).reduce((acc, p) => {
    const cat = p.categoryId;
    const sub = p.subcategory || t('menu.other');
    acc[cat] = acc[cat] || {};
    acc[cat][sub] = acc[cat][sub] || [];
    acc[cat][sub].push(p);
    return acc;
  }, {});

  const allowed = ['Pizza', 'Pasta', 'Insalate'];
  const filteredCats = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list.filter((c) => allowed.includes(c.name));
  }, [categories]);

  const activeCat = filteredCats.find((c) => c.name === active) || filteredCats[0];

  return (
    <div>
      <h2>{t('menu.title')}</h2>
      {!products || !categories ? (
        <div>{t('menu.loading')}</div>
      ) : (
        <div>
          <div className="tabs" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {allowed.map((name) => (
              <button
                key={name}
                className="btn"
                onClick={() => setActive(name)}
                style={name === active ? { background: 'var(--orange)', color: '#000' } : undefined}
              >
                {name}
              </button>
            ))}
          </div>
          {activeCat ? (
            <section key={activeCat._id} className="category">
              <h3>{activeCat.name}</h3>
              {Object.entries(grouped[activeCat._id] || {}).map(([sub, list]) => (
                <div key={sub} className="subcategory">
                  <h4>{sub}</h4>
                  <div className="grid">
                    {list.map((p) => (
                      <ProductCard key={p._id} product={p} onAdd={(prod) => addItem(prod)} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : (
            <div>{t('menu.loading')}</div>
          )}
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const [catRes, prodRes] = await Promise.all([
      fetch(`${API_BASE}/categories`),
      fetch(`${API_BASE}/products`)
    ]);
    const cats = catRes.ok ? await catRes.json() : [];
    const prods = prodRes.ok ? await prodRes.json() : [];
    return { props: { initialCategories: cats, initialProducts: prods } };
  } catch (_) {
    return { props: { initialCategories: [], initialProducts: [] } };
  }
}