import { useEffect, useState } from 'react';
import { API_BASE, apiPost, apiPut, apiDelete } from '../../src/lib/api';

export default function AdminProductsPage() {
  const [token, setToken] = useState(null);
  const [msg, setMsg] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [newExtras, setNewExtras] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) setMsg('Accesso admin richiesto');
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchProducts();
    fetchCategories();
  }, [token]);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = res.ok ? await res.json() : [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (_) {
      setProducts([]);
    }
  }

  const filteredProducts = (Array.isArray(products) ? products : []).filter((p) => {
    const byName = !search || String(p.name || '').toLowerCase().includes(search.toLowerCase());
    const byCat = !filterCat || p.categoryId === filterCat;
    const byAvail = !onlyAvailable || !!p.available;
    return byName && byCat && byAvail;
  });

  async function fetchCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = res.ok ? await res.json() : [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (_) {
      setCategories([]);
    }
  }

  async function saveProduct(p) {
    try {
      const ingredients = Array.isArray(p.ingredients) ? p.ingredients : String(p.ingredients || '').split(',').map((s) => s.trim()).filter(Boolean);
      const extras = Array.isArray(p.extras) ? p.extras.map((e) => ({ name: e.name || '', price: Number(e.price) || 0 })) : [];
      await apiPut(`/products/${p._id}`, { name: p.name, description: p.description || '', photoUrl: p.photoUrl || '', price: Number(p.price), categoryId: p.categoryId, subcategory: p.subcategory, available: !!p.available, ingredients, extras }, token);
      setMsg('Prodotto aggiornato');
      fetchProducts();
    } catch (e) {
      setMsg('Errore aggiornamento prodotto');
    }
  }

  async function removeProduct(id) {
    try {
      if (typeof window !== 'undefined') {
        const ok = window.confirm('Eliminare questo prodotto?');
        if (!ok) return;
      }
      await apiDelete(`/products/${id}`, token);
      setMsg('Prodotto eliminato');
      fetchProducts();
    } catch (e) {
      setMsg('Errore eliminazione prodotto');
    }
  }

  async function addProduct() {
    try {
      if (!newName || !newPrice || !newCategoryId) {
        setMsg('Nome, prezzo e categoria sono richiesti');
        return;
      }
      const ingredients = String(newIngredients || '').split(',').map((s) => s.trim()).filter(Boolean);
      const extras = (Array.isArray(newExtras) ? newExtras : []).map((e) => ({ name: e.name || '', price: Number(e.price) || 0 }));
      await apiPost('/products', { name: newName, description: newDescription || '', photoUrl: newPhotoUrl || '', price: Number(newPrice), categoryId: newCategoryId, subcategory: newSubcategory || undefined, available: true, ingredients, extras }, token);
      setMsg('Prodotto aggiunto');
      setNewName('');
      setNewPrice('');
      setNewCategoryId('');
      setNewSubcategory('');
      setNewDescription('');
      setNewPhotoUrl('');
      setNewIngredients('');
      setNewExtras([]);
      fetchProducts();
    } catch (e) {
      setMsg(e?.message || 'Errore aggiunta prodotto');
    }
  }

  return (
    <div>
      <div className="admin-back" style={{ marginBottom: 8 }}>
        <button className="btn" onClick={() => router.push('/admin')}>⬅️ Torna alla Dashboard</button>
      </div>
      <h2>Admin • Prodotti in vendita</h2>
      {msg && <div className="status">{msg}</div>}
      <div className="filters" style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Filtri catalogo</div>
        <input placeholder="Cerca per nome" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">Tutte le categorie</option>
          {(Array.isArray(categories) ? categories : []).map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} /> Solo disponibili
        </label>
      </div>
      <div className="add-product" style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Aggiungi nuovo prodotto</div>
        <input placeholder="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input placeholder="Immagine (URL)" value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} />
        <textarea placeholder="Descrizione" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
        <input placeholder="Prezzo" type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
        <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)}>
          <option value="">Categoria</option>
          {(Array.isArray(categories) ? categories : []).map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <input placeholder="Sottocategoria (opzionale)" value={newSubcategory} onChange={(e) => setNewSubcategory(e.target.value)} />
        <input placeholder="Ingredienti (separati da virgola)" value={newIngredients} onChange={(e) => setNewIngredients(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Extra</div>
          {(Array.isArray(newExtras) ? newExtras : []).map((ex, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <input placeholder="Nome extra" value={ex.name || ''} onChange={(e) => setNewExtras((list) => list.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
              <input placeholder="Prezzo" type="number" step="0.01" value={ex.price || 0} onChange={(e) => setNewExtras((list) => list.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))} />
              <button className="btn" onClick={() => setNewExtras((list) => list.filter((_, i) => i !== idx))}>Rimuovi</button>
            </div>
          ))}
          <button className="btn" onClick={() => setNewExtras((list) => [...list, { name: '', price: 0 }])}>Aggiungi extra</button>
        </div>
        <button className="btn" onClick={addProduct}>Aggiungi prodotto</button>
      </div>

      <div className="products">
        {(() => {
          const map = filteredProducts.reduce((acc, p) => {
            (acc[p.categoryId] = acc[p.categoryId] || []).push(p);
            return acc;
          }, {});
          const order = (Array.isArray(categories) ? categories.map((c) => c._id) : []);
          const catIds = (filterCat ? [filterCat] : Object.keys(map)).sort((a, b) => (order.indexOf(a) - order.indexOf(b)));
          return catIds.map((catId) => {
            const list = map[catId] || [];
            if (!list.length) return null;
            const catName = (Array.isArray(categories) ? categories.find((c) => c._id === catId)?.name : null) || '—';
            return (
              <section key={catId} className="category" style={{ marginTop: 16 }}>
                <h3>{catName}</h3>
                {list.map((p) => (
                  <div key={p._id} className="product admin" style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input style={{ minWidth: 200 }} value={p.name || ''} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, name: e.target.value } : x))} />
                      <input style={{ minWidth: 240 }} placeholder="Immagine (URL)" value={p.photoUrl || ''} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, photoUrl: e.target.value } : x))} />
                      <textarea style={{ minWidth: 260 }} placeholder="Descrizione" value={p.description || ''} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, description: e.target.value } : x))} />
                      <input style={{ width: 120 }} type="number" step="0.01" value={p.price || 0} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, price: e.target.value } : x))} />
                      <select value={p.categoryId || ''} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, categoryId: e.target.value } : x))}>
                        <option value="">Categoria</option>
                        {(Array.isArray(categories) ? categories : []).map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <input style={{ minWidth: 160 }} placeholder="Sottocategoria" value={p.subcategory || ''} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, subcategory: e.target.value } : x))} />
                      <input style={{ minWidth: 240 }} placeholder="Ingredienti (comma)" value={(Array.isArray(p.ingredients) ? p.ingredients.join(', ') : (p.ingredients || ''))} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, ingredients: e.target.value } : x))} />
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={!!p.available} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, available: e.target.checked } : x))} /> Disponibile
                      </label>
                      <button className="btn" onClick={() => saveProduct(p)}>Salva</button>
                      <button className="btn" onClick={() => removeProduct(p._id)}>Elimina</button>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Extra</div>
                      {(Array.isArray(p.extras) ? p.extras : []).map((ex, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <input placeholder="Nome extra" value={ex.name || ''} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, extras: (Array.isArray(x.extras) ? x.extras : []).map((e2, i) => i === idx ? { ...e2, name: e.target.value } : e2) } : x))} />
                          <input placeholder="Prezzo" type="number" step="0.01" value={ex.price || 0} onChange={(e) => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, extras: (Array.isArray(x.extras) ? x.extras : []).map((e2, i) => i === idx ? { ...e2, price: e.target.value } : e2) } : x))} />
                          <button className="btn" onClick={() => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, extras: (Array.isArray(x.extras) ? x.extras : []).filter((_, i) => i !== idx) } : x))}>Rimuovi</button>
                        </div>
                      ))}
                      <button className="btn" onClick={() => setProducts((l) => l.map((x) => x._id === p._id ? { ...x, extras: [...(Array.isArray(x.extras) ? x.extras : []), { name: '', price: 0 }] } : x))}>Aggiungi extra</button>
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Categoria: {categories.find((c) => c._id === p.categoryId)?.name || '—'}{p.subcategory ? ` • ${p.subcategory}` : ''}</div>
                  </div>
                ))}
              </section>
            );
          });
        })()}
      </div>
    </div>
  );
}