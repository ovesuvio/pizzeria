import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../src/components/Layout';
import { apiPost } from '../src/lib/api';
import { useI18n } from '../src/lib/i18n';

export default function ResetPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const { t } = useI18n();

  useEffect(() => {
    // If no token, show message
    if (!token) setMsg(t('reset.missingToken'));
  }, [token, t]);

  async function submit() {
    if (!token) return;
    try {
      await apiPost('/auth/reset', { token, password });
      setMsg(t('reset.success'));
      setTimeout(() => router.push('/profile'), 1500);
    } catch (e) {
      setMsg(t('reset.invalidToken'));
    }
  }

  return (
    <Layout>
      <div className="form">
        <h2>{t('reset.title')}</h2>
        <label>{t('reset.newPassword')}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" />
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={submit} disabled={!password}>{t('reset.setPassword')}</button>
        </div>
        {msg && <div className="status" style={{ marginTop: 12 }}>{msg}</div>}
      </div>
    </Layout>
  );
}