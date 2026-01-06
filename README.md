# O Vesuvio — Web App & Backend

Applicazione web stile Lieferando dedicata alla pizzeria O Vesuvio (Manzenstraße 60, 73037 Göppingen, tel. 07161-811727).

## Stack
- Frontend: React + Next.js
- Backend: Node.js + Express (+ Socket.IO per stato ordini in tempo reale)
- Database: MongoDB (Mongoose) con fallback in-memory per sviluppo rapido
- Auth: Email + telefono (JWT)
- Pagamenti: Stripe, PayPal (mock in sviluppo)
- i18n: Italiano con predisposizione DE/EN

## Monorepo
```
apps/
  web/   # Next.js
  api/   # Express API
tests/
  e2e/   # Test E2E (Playwright, mock)
```

## Avvio locale
1. Node.js >= 18
2. Opzionale: MongoDB (locale o Atlas). Se mancante, usa memoria volatile.
3. Imposta variabili in `apps/api/.env` e `apps/web/.env` (vedi `.env.example`).
4. Installa dipendenze:
   ```bash
   npm install
   ```
5. Avvia in sviluppo (api:4000, web:3000):
   ```bash
   npm run dev
   ```
6. Apri `http://localhost:3000`.

## Variabili d'ambiente
- `apps/api/.env`:
  - `PORT=4000`
  - `MONGODB_URI=mongodb://localhost:27017/ovesuvio` (opzionale)
  - `JWT_SECRET=supersecret`
  - `STRIPE_SECRET_KEY=sk_test_...` (opzionale in dev)
  - `PAYPAL_CLIENT_ID=...` (opzionale)
  - `PAYPAL_CLIENT_SECRET=...` (opzionale)
- `apps/web/.env`:
  - `NEXT_PUBLIC_API_BASE=http://localhost:4000`

## Deploy
- Backend: qualsiasi hosting Node (Render/Heroku/Vercel Functions non consigliato per WebSocket). Imposta env.
- Frontend: Vercel/Netlify. Configura `NEXT_PUBLIC_API_BASE` verso l'API.
- Database: MongoDB Atlas.

## Funzionalità
- Menu con categorie (Pizze, Pasta, Panini, Fritti, Insalate, Dolci, Bevande), stato Disponibile/Esaurito.
- Carrello, asporto/consegna, indirizzo, orario programmato (Mer–Dom 17:00–22:00, Lun–Mar chiuso), stima tempi.
- Pagamenti: Stripe/PayPal (mock in dev) o contanti alla consegna.
- Notifiche stato ordine: Ricevuto → In preparazione → In consegna → Consegnato.
- Admin: login, CRUD prodotti/categorie, ordini in tempo reale, aggiornamento stato, statistiche base, zone consegna.
- Extra: codici sconto, programma fedeltà (punti → sconto), stampa ordini PDF.

## Test E2E (mock)
```bash
npm run e2e
```
Genera screenshot e report in `tests/e2e/artifacts`.

## Note
- In assenza di MongoDB, i dati non persistono tra riavvii.
- Pagamenti reali richiedono chiavi e webhook; in dev si usa mock.
- UI principale in italiano, predisposta a lingue future (DE/EN).