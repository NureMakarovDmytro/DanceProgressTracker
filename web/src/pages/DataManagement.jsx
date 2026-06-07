import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

// Завантаження тексту як файлу через тимчасове посилання.
function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function DataManagement() {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');

  async function doBackup() {
    const data = await api.backup();
    download('dpt-backup.json', JSON.stringify(data, null, 2), 'application/json');
  }

  async function doExport() {
    const csv = await api.reportCsv();
    download('report.csv', csv, 'text/csv');
  }

  async function onRestoreFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const data = JSON.parse(await file.text());
    await api.restore(data);
    setMsg(t('data.restored'));
    setTimeout(() => setMsg(''), 2500);
  }

  return (
    <>
      <div className="page-head"><h1>{t('data.title')}</h1></div>
      {msg && <div className="notice">{msg}</div>}

      <div className="card">
        <strong>{t('data.backup')}</strong>
        <p className="muted">{t('data.backup_desc')}</p>
        <button className="btn btn-primary" onClick={doBackup}>{t('data.backup_btn')}</button>
      </div>

      <div className="card">
        <strong>{t('data.restore')}</strong>
        <p className="muted">{t('data.restore_desc')}</p>
        <button className="btn" onClick={() => fileRef.current.click()}>{t('data.restore_btn')}</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onRestoreFile} />
      </div>

      <div className="card">
        <strong>{t('data.export')}</strong>
        <p className="muted">{t('data.export_desc')}</p>
        <button className="btn" onClick={doExport}>{t('data.export_btn')}</button>
      </div>

      <div className="card">
        <strong>{t('data.settings')}</strong>
        <p className="muted" style={{ marginBottom: 0 }}>{t('data.settings_desc')}</p>
      </div>
    </>
  );
}
