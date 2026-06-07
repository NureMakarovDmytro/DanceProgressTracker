import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import Modal from '../components/Modal';

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [adding, setAdding] = useState(null);

  async function load() { setUsers(await api.getUsers()); }
  useEffect(() => { load(); }, []);

  async function addUser() {
    await api.addUser(adding);
    setAdding(null);
    load();
  }

  async function remove(u) {
    if (confirm(t('common.confirm_delete'))) { await api.deleteUser(u.id); load(); }
  }

  return (
    <>
      <div className="page-head">
        <h1>{t('users.title')}</h1>
        <button className="btn btn-primary"
          onClick={() => setAdding({ name: '', username: '', password: '', role: 'teacher' })}>
          {t('users.add')}
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>{t('users.name')}</th>
            <th>{t('users.username')}</th>
            <th>{t('users.role')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.username}</td>
              <td>{u.role === 'admin' ? t('nav.role_admin') : t('nav.role_teacher')}</td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => remove(u)}>{t('users.delete')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {adding && (
        <Modal title={t('users.add')} onClose={() => setAdding(null)} onSave={addUser}>
          <div className="field">
            <label>{t('users.name')}</label>
            <input value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('users.username')}</label>
            <input value={adding.username} onChange={(e) => setAdding({ ...adding, username: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('users.password')}</label>
            <input type="password" value={adding.password}
              onChange={(e) => setAdding({ ...adding, password: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('users.role')}</label>
            <select value={adding.role} onChange={(e) => setAdding({ ...adding, role: e.target.value })}>
              <option value="teacher">{t('nav.role_teacher')}</option>
              <option value="admin">{t('nav.role_admin')}</option>
            </select>
          </div>
        </Modal>
      )}
    </>
  );
}
