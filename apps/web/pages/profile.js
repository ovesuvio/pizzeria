import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiPost, apiPut, apiGetAuth } from '../src/lib/api';
import { useI18n } from '../src/lib/i18n';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [logged, setLogged] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setLogged(!!token);
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserEmail(payload?.email || '');
          setIsAdmin(!!payload?.isAdmin);
          // Carica dati profilo
          apiGetAuth('/users/me', token).then((data) => {
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
            setEmail(data.email || '');
          }).catch(() => {});
        } catch (_) {}
      }
      const onStorage = () => {
        const t = localStorage.getItem('token');
        setLogged(!!t);
        if (t) {
          try {
            const payload = JSON.parse(atob(t.split('.')[1]));
            setUserEmail(payload?.email || '');
            setIsAdmin(!!payload?.isAdmin);
            apiGetAuth('/users/me', t).then((data) => {
              setFirstName(data.firstName || '');
              setLastName(data.lastName || '');
              setPhone(data.phone || '');
              setAddress(data.address || '');
              setEmail(data.email || '');
            }).catch(() => {});
          } catch (_) {}
        } else {
          setUserEmail('');
          setIsAdmin(false);
        }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
  }, []);

  async function register() {
    try {
      if (!privacyConsent) {
        setMsg(t('profile.messages.registrationError'));
        return;
      }
      const res = await apiPost('/auth/register', { firstName, lastName, email, phone, address, password, privacyConsent: true, privacyPolicyVersion: process.env.NEXT_PUBLIC_PRIVACY_VERSION || 'v1' });
      setMsg(t('profile.messages.registrationSuccess'));
    } catch (e) {
      setMsg(t('profile.messages.registrationError'));
    }
  }

  async function login() {
    try {
      const res = await apiPost('/auth/login', { email, password });
      localStorage.setItem('token', res.token);
      setMsg(t('profile.messages.loginSuccess'));
      setLogged(true);
      try {
        const payload = JSON.parse(atob(res.token.split('.')[1]));
        setUserEmail(payload?.email || '');
        setIsAdmin(!!payload?.isAdmin);
      } catch (_) {}
      // Se l'utente è admin, reindirizza alla dashboard
      try {
        const payload = JSON.parse(atob(res.token.split('.')[1]));
        if (payload?.isAdmin) {
          router.push('/admin');
        }
      } catch (_) {}
    } catch (e) {
      setMsg(t('profile.messages.loginError'));
    }
  }

  function logout() {
    try { localStorage.removeItem('token'); } catch (_) {}
    setLogged(false);
    setMsg(t('profile.messages.logoutSuccess'));
    setUserEmail('');
    setIsAdmin(false);
  }

  async function saveProfile() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      const res = await apiPut('/users/me', { firstName, lastName, phone, address }, token);
      setMsg(t('profile.messages.profileUpdated'));
      setFirstName(res.firstName || firstName);
      setLastName(res.lastName || lastName);
      setPhone(res.phone || phone);
      setAddress(res.address || address);
      setEmail(res.email || email);
    } catch (e) {
      setMsg(t('profile.messages.profileUpdateError'));
    }
  }

  async function changeEmail() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || !newEmail) return;
    try {
      const res = await apiPut('/users/me/email', { email: newEmail }, token);
      if (res.token) {
        localStorage.setItem('token', res.token);
        setUserEmail(res.email || newEmail);
      }
      setMsg(t('profile.messages.emailUpdated'));
      setNewEmail('');
    } catch (e) {
      setMsg(t('profile.messages.emailUpdateError'));
    }
  }

  async function changePassword() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || !currentPassword || !newPassword) return;
    try {
      await apiPut('/users/me/password', { currentPassword, newPassword }, token);
      setMsg(t('profile.messages.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      setMsg(t('profile.messages.passwordUpdateError'));
    }
  }

  async function requestReset() {
    try {
      const res = await apiPost('/auth/request-reset', { email });
      setMsg(t('profile.messages.resetSent'));
      if (res?.previewResetUrl) {
        setMsg(`${t('profile.messages.resetPreviewLinkPrefix')}${res.previewResetUrl}`);
      }
    } catch (e) {
      setMsg(t('profile.messages.loginError'));
    }
  }

  return (
    <div>
      <h2>{t('profile.title')}</h2>
      {!logged && (
        <div className="form">
          <h3>{t('profile.register.title')}</h3>
          <label>{t('profile.fields.firstName')}</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="nome" />
          <label>{t('profile.fields.lastName')}</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="cognome" />
          <label>{t('profile.fields.email')}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
          <label>{t('profile.fields.phone')}</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="telefono" />
          <label>{t('profile.fields.address')}</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="via e numero, città" />
          <label>{t('profile.fields.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
          <div style={{ marginTop: 8 }}>
            <label>
              <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} /> {t('profile.fields.privacyConsent')}
            </label>
          </div>
          <div className="actions">
            <button className="btn" onClick={register} disabled={!privacyConsent}>{t('profile.register.button')}</button>
          </div>
        </div>
      )}
      {!logged ? (
        <div className="form" style={{ marginTop: 16 }}>
          <h3>{t('profile.login.title')}</h3>
          <label>{t('profile.fields.user')}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user" />
          <label>{t('profile.fields.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
          <div className="actions">
            <button className="btn primary" onClick={login}>{t('profile.login.button')}</button>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => setShowForgot((s) => !s)}>{t('profile.forgot.toggle')}</button>
          </div>
          {showForgot && (
            <div style={{ marginTop: 8 }}>
              <label>{t('profile.forgot.resetEmailLabel')}</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email registrata" />
              <div className="actions" style={{ marginTop: 8 }}>
                <button className="btn" onClick={requestReset}>{t('profile.forgot.sendLink')}</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="form" style={{ marginTop: 16 }}>
          <h3>{t('profile.account.title')}</h3>
          <div>{t('profile.fields.email')}: {userEmail || '—'}</div>
          <div>{t('profile.account.role')}: {isAdmin ? t('profile.role.admin') : t('profile.role.customer')}</div>
          {isAdmin && (
            <div style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => router.push('/admin')}>{t('profile.admin.goDashboard')}</button>
            </div>
          )}
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={logout}>Logout</button>
          </div>
          <hr style={{ margin: '16px 0' }} />
          <h3>Modifica dati</h3>
          <label>Nome</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="nome" />
          <label>Cognome</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="cognome" />
          <label>Telefono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="telefono" />
          <label>Indirizzo</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="via e numero, città" />
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={saveProfile}>Salva modifiche</button>
          </div>

          <hr style={{ margin: '16px 0' }} />
          <h3>Cambia email</h3>
          <label>Nuova email</label>
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nuova email" />
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={changeEmail} disabled={!newEmail}>Aggiorna email</button>
          </div>

          <hr style={{ margin: '16px 0' }} />
          <h3>Cambia password</h3>
          <label>Password corrente</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="password corrente" />
          <label>Nuova password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="nuova password" />
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={changePassword} disabled={!currentPassword || !newPassword}>Aggiorna password</button>
          </div>
        </div>
      )}
      {msg && <div className="status">{msg}</div>}
    </div>
  );
}