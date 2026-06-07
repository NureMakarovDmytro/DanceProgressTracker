import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { useAuth } from '../auth';
import Modal from '../components/Modal';

export default function Groups() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [groups, setGroups] = useState([]);
  const [editing, setEditing] = useState(null); // { _id?, name, style, level }

  async function load() { setGroups(await api.getGroups()); }
  useEffect(() => { load(); }, []);

  async function saveGroup() {
    if (editing._id) await api.updateGroup(editing._id, editing);
    else await api.addGroup(editing);
    setEditing(null);
    load();
  }

  async function remove(g) {
    if (confirm(t('common.confirm_delete'))) { await api.deleteGroup(g._id); load(); }
  }

  return (
    <>
      <div className="page-head">
        <h1>{t('groups.title')}</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setEditing({ name: '', style: '', level: '' })}>
            {t('groups.add')}
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="card empty">{t('groups.empty')}</div>
      ) : (
        <div className="grid">
          {groups.map((g) => (
            <div className="card" key={g._id}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{g.name}</strong>
                <span className="tag">{g.level || '—'}</span>
              </div>
              <p className="muted" style={{ margin: '6px 0 14px' }}>{g.style || '—'}</p>
              <div className="row">
                <button className="btn btn-sm btn-primary" onClick={() => navigate(`/groups/${g._id}`)}>
                  {t('groups.open')}
                </button>
                {isAdmin && (
                  <>
                    <button className="btn btn-sm" onClick={() => setEditing(g)}>{t('groups.edit')}</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(g)}>{t('groups.delete')}</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={editing._id ? t('groups.edit') : t('groups.add')}
          onClose={() => setEditing(null)}
          onSave={saveGroup}
        >
          <div className="field">
            <label>{t('groups.name')}</label>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('groups.style')}</label>
            <input value={editing.style} onChange={(e) => setEditing({ ...editing, style: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('groups.level')}</label>
            <input value={editing.level} onChange={(e) => setEditing({ ...editing, level: e.target.value })} />
          </div>
        </Modal>
      )}
    </>
  );
}
