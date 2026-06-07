import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeLanguage, LOCALES } from '../i18n';
import { useAuth } from '../auth';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/groups');
    } catch (err) {
      setError(err.message || t('login.error'));
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-box" onSubmit={submit}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1>{t('app')}</h1>
          <div className="lang">
            {Object.keys(LOCALES).map((code) => (
              <button type="button" key={code}
                className={i18n.language === code ? 'active' : ''}
                onClick={() => changeLanguage(code)}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <p className="sub">{t('login.title')}</p>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label>{t('login.username')}</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>{t('login.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }}>{t('login.submit')}</button>
        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>{t('login.hint')}</p>
      </form>
    </div>
  );
}
