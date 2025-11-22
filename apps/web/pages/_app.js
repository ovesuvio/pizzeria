import '../styles/globals.css';
import Head from 'next/head';
import { CartProvider } from '../src/context/CartContext';
import Layout from '../src/components/Layout';
import { I18nProvider } from '../src/lib/i18n';

export default function App({ Component, pageProps }) {
  return (
    <I18nProvider>
      <CartProvider>
        <Layout>
          <Head>
            <style>{'body{display:block !important}'}</style>
          </Head>
          <Component {...pageProps} />
        </Layout>
      </CartProvider>
    </I18nProvider>
  );
}