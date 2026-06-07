import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { useAuth } from '../auth';
import { formatDate, collator } from '../i18n';
import Modal from '../components/Modal';

const GRADES = [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const today = () => new Date().toISOString().slice(0, 10);

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [editor, setEditor] = useState(null); // { lessonId, date, records: { sid: {present, grade} } }
  const [adding, setAdding] = useState(null);
  const [saved, setSaved] = useState(false);

  async function load() {
    const [groups, st, stat, less] = await Promise.all([
      api.getGroups(), api.getStudents(id), api.getStats(id), api.getLessons(id),
    ]);
    setGroup(groups.find((g) => g._id === id) || null);
    const c = collator();
    setStudents([...st].sort((a, b) => c.compare(a.lastName, b.lastName)));
    setStats(stat);
    setLessons([...less].sort((a, b) => b.date.localeCompare(a.date))); // новіші зверху
  }
  useEffect(() => { load(); }, [id, i18n.language]);

  const statFor = useMemo(() => {
    const m = {}; stats.forEach((s) => { m[s.studentId] = s; }); return m;
  }, [stats]);

  // --- Заняття ---
  function openNew() {
    const rec = {};
    students.forEach((s) => { rec[s._id] = { present: true, grade: null }; });
    setEditor({ lessonId: null, date: today(), records: rec });
  }
  function openEdit(lesson) {
    const rec = {};
    students.forEach((s) => { rec[s._id] = { present: false, grade: null }; });
    lesson.records.forEach((r) => { rec[r.student] = { present: r.present, grade: r.grade }; });
    setEditor({ lessonId: lesson._id, date: lesson.date, records: rec });
  }
  function setRec(sid, patch) {
    setEditor((e) => ({ ...e, records: { ...e.records, [sid]: { ...e.records[sid], ...patch } } }));
  }
  async function saveLesson() {
    await api.saveLesson({
      group: id,
      date: editor.date,
      records: students.map((s) => ({
        student: s._id,
        present: editor.records[s._id]?.present ?? false,
        grade: editor.records[s._id]?.grade ?? null,
      })),
    });
    setEditor(null);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    load();
  }
  async function removeLesson(lesson) {
    if (confirm(t('common.confirm_delete'))) { await api.deleteLesson(lesson._id); load(); }
  }

  // --- Учні (адміністратор) ---
  async function addStudent() {
    await api.addStudent({ group: id, lastName: adding.lastName, firstName: adding.firstName });
    setAdding(null); load();
  }
  async function removeStudent(s) {
    if (confirm(t('common.confirm_delete'))) { await api.deleteStudent(s._id); load(); }
  }

  const presentCount = (l) => l.records.filter((r) => r.present).length;

  return (
    <>
      <div className="page-head">
        <div className="row">
          <button className="btn btn-sm" onClick={() => navigate('/groups')}>← {t('common.back')}</button>
          <h1 style={{ marginLeft: 10 }}>{group?.name || ''}</h1>
        </div>
      </div>

      {saved && <div className="notice">{t('attendance.saved')}</div>}

      {/* ---------- Заняття ---------- */}
      <div className="page-head" style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>{t('lessons.title')}</h2>
        <button className="btn btn-primary" onClick={openNew}>{t('lessons.add')}</button>
      </div>

      {editor && (
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <strong>{editor.lessonId ? t('lessons.edit') : t('lessons.new')}</strong>
            <span className="muted" style={{ marginLeft: 12 }}>{formatDate(editor.date)}</span>
            <div className="right row" style={{ gap: 8 }}>
              <button className="btn" onClick={() => setEditor(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={saveLesson}>{t('attendance.save')}</button>
            </div>
          </div>
          <div className="field" style={{ maxWidth: 200 }}>
            <label>{t('attendance.date')}</label>
            <input type="date" value={editor.date}
              onChange={(e) => setEditor({ ...editor, date: e.target.value })} />
          </div>
          {students.length === 0 ? (
            <p className="muted">{t('students.empty')}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('students.lastName')}</th>
                  <th>{t('students.firstName')}</th>
                  <th>{t('attendance.present')}</th>
                  <th>{t('attendance.grade')}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.lastName}</td>
                    <td>{s.firstName}</td>
                    <td>
                      <input type="checkbox" checked={editor.records[s._id]?.present ?? false}
                        onChange={(e) => setRec(s._id, {
                          present: e.target.checked,
                          grade: e.target.checked ? editor.records[s._id]?.grade : null,
                        })} />
                    </td>
                    <td>
                      <select value={editor.records[s._id]?.grade ?? ''}
                        disabled={!editor.records[s._id]?.present}
                        onChange={(e) => setRec(s._id, { grade: e.target.value ? Number(e.target.value) : null })}>
                        {GRADES.map((g) => (
                          <option key={g ?? 'n'} value={g ?? ''}>{g ?? t('attendance.no_grade')}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="card empty">{t('lessons.empty')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('attendance.date')}</th>
              <th>{t('lessons.present_of')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l._id}>
                <td>{formatDate(l.date)}</td>
                <td>{presentCount(l)} / {l.records.length}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm" onClick={() => openEdit(l)}>{t('lessons.edit')}</button>{' '}
                  <button className="btn btn-sm btn-danger" onClick={() => removeLesson(l)}>{t('lessons.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ---------- Учні та статистика ---------- */}
      <div className="page-head" style={{ marginTop: 26, marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>{t('stats.title')}</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setAdding({ lastName: '', firstName: '' })}>
            {t('students.add')}
          </button>
        )}
      </div>

      {students.length === 0 ? (
        <div className="card empty">{t('students.empty')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('students.lastName')}</th>
              <th>{t('students.firstName')}</th>
              <th>{t('students.absences')}</th>
              <th>{t('students.average')}</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id}>
                <td>{s.lastName}</td>
                <td>{s.firstName}</td>
                <td>{statFor[s._id]?.absences ?? 0}</td>
                <td>{statFor[s._id]?.average ?? t('attendance.no_grade')}</td>
                {isAdmin && (
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-danger" onClick={() => removeStudent(s)}>{t('groups.delete')}</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {adding && (
        <Modal title={t('students.add')} onClose={() => setAdding(null)} onSave={addStudent}>
          <div className="field">
            <label>{t('students.lastName')}</label>
            <input value={adding.lastName} onChange={(e) => setAdding({ ...adding, lastName: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('students.firstName')}</label>
            <input value={adding.firstName} onChange={(e) => setAdding({ ...adding, firstName: e.target.value })} />
          </div>
        </Modal>
      )}
    </>
  );
}
