import useSWR from 'swr';
import { apiGet, API_BASE } from '../src/lib/api';
import { useCart } from '../src/context/CartContext';
import ProductCard from '../src/components/ProductCard';
import { useI18n } from '../src/lib/i18n';

export default function MenuPage({ initialCategories = null, initialProducts = null }) {
  const { t } = useI18n();
  const { data: categories } = useSWR('/categories', apiGet, { fallbackData: initialCategories });
  const { data: products } = useSWR('/products', apiGet, { fallbackData: initialProducts });
  const { addItem } = useCart();

  // Raggruppa per categoria → sottocategoria
  const grouped = (products || []).reduce((acc, p) => {
    const cat = p.categoryId;
    const sub = p.subcategory || t('menu.other');
    acc[cat] = acc[cat] || {};
    acc[cat][sub] = acc[cat][sub] || [];
    acc[cat][sub].push(p);
    return acc;
  }, {});

  return (
    <div>
      <h2>{t('menu.title')}</h2>
      {!products || !categories ? (
        <div>{t('menu.loading')}</div>
      ) : (
        categories.map((c) => (
          <section key={c._id} className="category">
            <h3>{c.name}</h3>
            {Object.entries(grouped[c._id] || {}).map(([sub, list]) => (
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
        ))
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