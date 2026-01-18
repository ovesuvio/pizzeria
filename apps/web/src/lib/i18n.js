import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const defaultLang = 'it';

const messages = {
  it: {
    nav: {
      home: 'Home',
      menu: 'Menu',
      cart: 'Carrello',
      profile: 'Profilo',
      orders: 'Storico ordini',
      gallery: 'Galleria',
      news: 'Notizie',
      admin: 'Admin',
      login: 'Accedi',
      logout: 'Logout',
      language: 'Lingua'
    },
    profile: {
      title: 'Profilo utente',
      register: { title: 'Registrazione', button: 'Registrati' },
      login: { title: 'Accedi', button: 'Accedi' },
      fields: {
        firstName: 'Nome',
        lastName: 'Cognome',
        user: 'User',
        email: 'Email',
        phone: 'Telefono',
        address: 'Indirizzo',
        password: 'Password',
        privacyConsent: 'Accetto l’informativa privacy'
      },
      forgot: {
        toggle: 'Password dimenticata?',
        resetEmailLabel: 'Email per il reset',
        sendLink: 'Invia link di reset'
      },
      account: { title: 'Account', role: 'Ruolo' },
      role: { admin: 'Admin', customer: 'Cliente' },
      admin: { goDashboard: 'Vai alla Admin dashboard' },
      messages: {
        registrationSuccess: 'Registrazione completata. Accedi.',
        registrationError: 'Errore registrazione: assicurati di compilare tutti i campi',
        loginSuccess: 'Accesso effettuato',
        loginError: 'Errore accesso',
        profileUpdated: 'Dati aggiornati',
        profileUpdateError: 'Errore aggiornamento dati',
        emailUpdated: 'Email aggiornata',
        emailUpdateError: 'Errore aggiornamento email',
        passwordUpdated: 'Password aggiornata',
        passwordUpdateError: 'Errore aggiornamento password',
        resetSent: 'Email di reset inviata (controlla la posta)',
        resetPreviewLinkPrefix: 'Email inviata. Link dev: ',
        logoutSuccess: 'Uscita effettuata'
      }
    },
    home: {
      hero: {
        title: 'Pizzeria O Vesuvio',
        address: 'Manzenstraße 60, 73037 Göppingen • Tel. 07161-811727',
        hours: 'Mer–Dom 17:00–22:00 • Lun–Mar chiuso',
        browseMenu: 'Sfoglia il menu'
      },
      readMore: 'Di più'
    },
    gallery: {
      title: 'Galleria foto',
      loading: 'Caricamento...',
      empty: 'Nessuna immagine trovata'
    },
    menu: {
      title: 'Menu',
      loading: 'Caricamento...',
      other: 'Altro'
    },
    product: {
      available: 'Disponibile',
      soldout: 'Esaurito',
      add: 'Aggiungi'
    },
    cart: {
      title: 'Carrello',
      empty: 'Il carrello è vuoto.',
      goMenu: 'Vai al menu',
      remove: 'Rimuovi',
      mode: { pickup: 'Asporto', delivery: 'Consegna' },
      subtotal: 'Subtotale',
      deliveryFee: 'Consegna',
      total: 'Totale',
      checkout: 'Procedi al checkout'
    },
    checkout: {
      title: 'Checkout',
      closed: 'Il ristorante è chiuso. Programma un orario tra 17:00–22:00',
      mustLogin: 'Per ordinare devi essere registrato e loggato.',
      address: 'Indirizzo (per consegna)',
      addressPlaceholder: 'Via e numero, città',
      scheduled: 'Orario programmato',
      payment: 'Metodo di pagamento',
      payStripe: 'Carta (Stripe)',
      payVisa: 'Visa',
      payPaypal: 'PayPal',
      payCash: 'Alla consegna',
      place: 'Conferma ordine',
      orderConfirmedPrefix: 'Ordine confermato: ',
      loginRequired: 'Devi essere autenticato per ordinare. Vai al profilo per il login.'
    },
    orders: {
      title: 'Storico ordini',
      errorAccess: 'Accedi per visualizzare i tuoi ordini',
      loading: 'Caricamento...',
      empty: 'Nessun ordine trovato',
      status: 'Stato',
      total: 'Totale',
      updatePrefix: 'Aggiornamento: ordine '
    },
    reset: {
      title: 'Recupero password',
      newPassword: 'Nuova password',
      setPassword: 'Imposta password',
      missingToken: 'Token reset mancante',
      success: 'Password aggiornata. Ora puoi effettuare il login.',
      invalidToken: 'Token invalido o scaduto'
    },
    order: {
      status: {
        received: 'Ordine ricevuto',
        preparation: 'Ordine in preparazione',
        delivery: 'Ordine in consegna',
        delivered: 'Ordine consegnato'
      }
    },
    global: {
      orderingSuspended: 'Servizio di ordinazione momentaneamente sospeso, ci scusiamo per il disagio.',
      resumeInPrefix: 'Torna tra',
      time: { minute: 'minuto', minutes: 'minuti', hour: 'ora', hours: 'ore', day: 'giorno', days: 'giorni', week: 'settimana', weeks: 'settimane', month: 'mese', months: 'mesi' }
    }
    ,
    print: {
      items: 'Articoli',
      thanks: 'Grazie per aver scelto noi.'
    }
  },
  de: {
    nav: {
      home: 'Home',
      menu: 'Speisekarte',
      cart: 'Warenkorb',
      profile: 'Profil',
      orders: 'Bestellverlauf',
      gallery: 'Galerie',
      news: 'Neuigkeiten',
      admin: 'Admin',
      login: 'Anmelden',
      logout: 'Abmelden',
      language: 'Sprache'
    },
    profile: {
      title: 'Benutzerprofil',
      register: { title: 'Registrierung', button: 'Registrieren' },
      login: { title: 'Anmelden', button: 'Anmelden' },
      fields: {
        firstName: 'Vorname',
        lastName: 'Nachname',
        user: 'Benutzer',
        email: 'E-Mail',
        phone: 'Telefon',
        address: 'Adresse',
        password: 'Passwort',
        privacyConsent: 'Ich akzeptiere die Datenschutzerklärung'
      },
      forgot: {
        toggle: 'Passwort vergessen?',
        resetEmailLabel: 'E-Mail für Zurücksetzen',
        sendLink: 'Reset-Link senden'
      },
      account: { title: 'Konto', role: 'Rolle' },
      role: { admin: 'Admin', customer: 'Kunde' },
      admin: { goDashboard: 'Zur Admin-Dashboard' },
      messages: {
        registrationSuccess: 'Registrierung abgeschlossen. Anmelden.',
        registrationError: 'Registrierungsfehler: bitte alle Felder ausfüllen',
        loginSuccess: 'Anmeldung erfolgreich',
        loginError: 'Fehler bei Anmeldung',
        profileUpdated: 'Daten aktualisiert',
        profileUpdateError: 'Fehler beim Aktualisieren der Daten',
        emailUpdated: 'E-Mail aktualisiert',
        emailUpdateError: 'Fehler beim Aktualisieren der E-Mail',
        passwordUpdated: 'Passwort aktualisiert',
        passwordUpdateError: 'Fehler beim Aktualisieren des Passworts',
        resetSent: 'Reset-E-Mail gesendet (Posteingang prüfen)',
        resetPreviewLinkPrefix: 'E-Mail gesendet. Dev-Link: ',
        logoutSuccess: 'Abmeldung erfolgreich'
      }
    },
    home: {
      hero: {
        title: 'Pizzeria O Vesuvio',
        address: 'Manzenstraße 60, 73037 Göppingen • Tel. 07161-811727',
        hours: 'Mi–So 17:00–22:00 • Mo–Di geschlossen',
        browseMenu: 'Zur Speisekarte'
      },
      readMore: 'Mehr'
    },
    gallery: {
      title: 'Fotogalerie',
      loading: 'Lädt...',
      empty: 'Keine Bilder gefunden'
    },
    menu: {
      title: 'Speisekarte',
      loading: 'Lädt...',
      other: 'Sonstiges'
    },
    product: {
      available: 'Verfügbar',
      soldout: 'Ausverkauft',
      add: 'Hinzufügen'
    },
    cart: {
      title: 'Warenkorb',
      empty: 'Der Warenkorb ist leer.',
      goMenu: 'Zur Speisekarte',
      remove: 'Entfernen',
      mode: { pickup: 'Abholung', delivery: 'Lieferung' },
      subtotal: 'Zwischensumme',
      deliveryFee: 'Lieferung',
      total: 'Gesamt',
      checkout: 'Zur Kasse'
    },
    checkout: {
      title: 'Kasse',
      closed: 'Das Restaurant ist geschlossen. Plane eine Zeit zwischen 17:00–22:00',
      mustLogin: 'Zum Bestellen musst du registriert und angemeldet sein.',
      address: 'Adresse (für Lieferung)',
      addressPlaceholder: 'Straße und Hausnummer, Stadt',
      scheduled: 'Geplante Zeit',
      payment: 'Zahlungsmethode',
      payStripe: 'Karte (Stripe)',
      payVisa: 'Visa',
      payPaypal: 'PayPal',
      payCash: 'Bar bei Lieferung',
      place: 'Bestellung bestätigen',
      orderConfirmedPrefix: 'Bestellung bestätigt: ',
      loginRequired: 'Du musst angemeldet sein, um zu bestellen. Gehe zum Profil für die Anmeldung.'
    },
    orders: {
      title: 'Bestellverlauf',
      errorAccess: 'Melde dich an, um deine Bestellungen zu sehen',
      loading: 'Lädt...',
      empty: 'Keine Bestellungen gefunden',
      status: 'Status',
      total: 'Gesamt',
      updatePrefix: 'Aktualisierung: Bestellung '
    },
    reset: {
      title: 'Passwort zurücksetzen',
      newPassword: 'Neues Passwort',
      setPassword: 'Passwort setzen',
      missingToken: 'Fehlendes Reset-Token',
      success: 'Passwort aktualisiert. Du kannst dich jetzt anmelden.',
      invalidToken: 'Ungültiges oder abgelaufenes Token'
    },
    order: {
      status: {
        received: 'Bestellung eingegangen',
        preparation: 'Bestellung in Vorbereitung',
        delivery: 'Bestellung in Lieferung',
        delivered: 'Bestellung geliefert'
      }
    },
    global: {
      orderingSuspended: 'Online-Bestellungen vorübergehend ausgesetzt, wir entschuldigen uns für die Unannehmlichkeiten.',
      resumeInPrefix: 'Verfügbar in',
      time: { minute: 'Minute', minutes: 'Minuten', hour: 'Stunde', hours: 'Stunden', day: 'Tag', days: 'Tage', week: 'Woche', weeks: 'Wochen', month: 'Monat', months: 'Monate' }
    }
    ,
    print: {
      items: 'Artikel',
      thanks: 'Vielen Dank, dass Sie sich für uns entschieden haben.'
    }
  },
  en: {
    nav: {
      home: 'Home',
      menu: 'Menu',
      cart: 'Cart',
      profile: 'Profile',
      orders: 'Order History',
      gallery: 'Gallery',
      news: 'News',
      admin: 'Admin',
      login: 'Sign in',
      logout: 'Sign out',
      language: 'Language'
    },
    profile: {
      title: 'User Profile',
      register: { title: 'Registration', button: 'Register' },
      login: { title: 'Sign in', button: 'Sign in' },
      fields: {
        firstName: 'First name',
        lastName: 'Last name',
        user: 'User',
        email: 'Email',
        phone: 'Phone',
        address: 'Address',
        password: 'Password',
        privacyConsent: 'I accept the privacy policy'
      },
      forgot: {
        toggle: 'Forgot password?',
        resetEmailLabel: 'Email for reset',
        sendLink: 'Send reset link'
      },
      account: { title: 'Account', role: 'Role' },
      role: { admin: 'Admin', customer: 'Customer' },
      admin: { goDashboard: 'Go to Admin dashboard' },
      messages: {
        registrationSuccess: 'Registration completed. Sign in.',
        registrationError: 'Registration error: please fill in all fields',
        loginSuccess: 'Signed in',
        loginError: 'Sign in error',
        profileUpdated: 'Data updated',
        profileUpdateError: 'Error updating data',
        emailUpdated: 'Email updated',
        emailUpdateError: 'Error updating email',
        passwordUpdated: 'Password updated',
        passwordUpdateError: 'Error updating password',
        resetSent: 'Reset email sent (check your inbox)',
        resetPreviewLinkPrefix: 'Email sent. Dev link: ',
        logoutSuccess: 'Signed out'
      }
    },
    home: {
      hero: {
        title: 'Pizzeria O Vesuvio',
        address: 'Manzenstraße 60, 73037 Göppingen • Tel. 07161-811727',
        hours: 'Wed–Sun 17:00–22:00 • Mon–Tue closed',
        browseMenu: 'Browse the menu'
      },
      readMore: 'More'
    },
    gallery: {
      title: 'Photo Gallery',
      loading: 'Loading...',
      empty: 'No images found'
    },
    menu: {
      title: 'Menu',
      loading: 'Loading...',
      other: 'Other'
    },
    product: {
      available: 'Available',
      soldout: 'Sold out',
      add: 'Add'
    },
    cart: {
      title: 'Cart',
      empty: 'Your cart is empty.',
      goMenu: 'Browse the menu',
      remove: 'Remove',
      mode: { pickup: 'Pickup', delivery: 'Delivery' },
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery',
      total: 'Total',
      checkout: 'Proceed to checkout'
    },
    checkout: {
      title: 'Checkout',
      closed: 'The restaurant is closed. Schedule between 17:00–22:00',
      mustLogin: 'To order you must be registered and signed in.',
      address: 'Address (for delivery)',
      addressPlaceholder: 'Street and number, city',
      scheduled: 'Scheduled time',
      payment: 'Payment method',
      payStripe: 'Card (Stripe)',
      payVisa: 'Visa',
      payPaypal: 'PayPal',
      payCash: 'Cash on delivery',
      place: 'Place order',
      orderConfirmedPrefix: 'Order confirmed: ',
      loginRequired: 'You must be authenticated to order. Go to profile to login.'
    },
    orders: {
      title: 'Order History',
      errorAccess: 'Sign in to see your orders',
      loading: 'Loading...',
      empty: 'No orders found',
      status: 'Status',
      total: 'Total',
      updatePrefix: 'Update: order '
    },
    reset: {
      title: 'Password recovery',
      newPassword: 'New password',
      setPassword: 'Set password',
      missingToken: 'Missing reset token',
      success: 'Password updated. You can now sign in.',
      invalidToken: 'Invalid or expired token'
    },
    order: {
      status: {
        received: 'Order received',
        preparation: 'Order in preparation',
        delivery: 'Order out for delivery',
        delivered: 'Order delivered'
      }
    },
    global: {
      orderingSuspended: 'Online ordering temporarily suspended, we apologize for the inconvenience.',
      resumeInPrefix: 'Available again in',
      time: { minute: 'minute', minutes: 'minutes', hour: 'hour', hours: 'hours', day: 'day', days: 'days', week: 'week', weeks: 'weeks', month: 'month', months: 'months' }
    }
    ,
    print: {
      items: 'Items',
      thanks: 'Thank you for choosing us.'
    }
  }
};

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

const I18nContext = createContext({ lang: defaultLang, setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(defaultLang);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lang');
      if (stored && messages[stored]) setLangState(stored);
      const onStorage = () => {
        const l = localStorage.getItem('lang');
        if (l && messages[l]) setLangState(l);
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
  }, []);

  const setLang = (l) => {
    if (!messages[l]) return;
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch (_) {}
  };

  const t = useMemo(() => {
    return (key) => {
      const val = getNested(messages[lang], key);
      return val !== undefined ? val : key;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export const SUPPORTED_LANGS = ['it', 'de', 'en'];

export function getTForLang(lang) {
  return (key) => {
    const l = messages[lang] ? lang : defaultLang;
    const val = getNested(messages[l], key);
    return val !== undefined ? val : key;
  };
}