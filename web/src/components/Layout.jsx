import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeLanguage, LOCALES } from '../i18n';
import { useAuth } from '../auth';

// Спільна шапка: бренд, навігація за роллю, перемикач мови, вихід.
export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <header className="topbar">
        <span className="brand">{t('app')}</span>
        <nav>
          <NavLink to="/groups">{t('nav.groups')}</NavLink>
          {isAdmin && <NavLink to="/users">{t('nav.users')}</NavLink>}
          {isAdmin && <NavLink to="/data">{t('nav.data')}</NavLink>}
        </nav>
        <span className="spacer" />
        <div className="lang">
          {Object.keys(LOCALES).map((code) => (
            <button
              key={code}
              className={i18n.language === code ? 'active' : ''}
              onClick={() => changeLanguage(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="user">
          {user?.name} · {isAdmin ? t('nav.role_admin') : t('nav.role_teacher')}
        </span>
        <button className="btn btn-sm" onClick={() => { logout(); navigate('/login'); }}>
          {t('nav.logout')}
        </button>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
