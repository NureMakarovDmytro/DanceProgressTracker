// Шар доступу до даних.
//   - якщо задано VITE_API_URL — звертається до реального REST-бекенда (Express);
//   - інакше працює у демо-режимі на localStorage (для автономного запуску web).
// Інтерфейс функцій однаковий в обох режимах, тому решта застосунку про це не знає.

const API_URL = import.meta.env.VITE_API_URL;
const USE_MOCK = !API_URL;

// ---------- РЕАЛЬНИЙ БЕКЕНД ----------

let token = localStorage.getItem('token') || null;

async function http(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.status === 204 ? null : res.json();
}

// ---------- ДЕМО-РЕЖИМ (localStorage) ----------

const SEED = {
  users: [
    { id: 'u1', username: 'admin', password: 'admin', name: 'Адміністратор', role: 'admin' },
    { id: 'u2', username: 'teacher', password: 'teacher', name: 'Олена Викладач', role: 'teacher' },
  ],
  groups: [
    { _id: 'g1', name: 'Hip-Hop A', style: 'Hip-Hop', level: 'Початковий' },
    { _id: 'g2', name: 'Contemporary B', style: 'Contemporary', level: 'Середній' },
  ],
  students: [
    { _id: 's1', group: 'g1', lastName: 'Коваль', firstName: 'Іван' },
    { _id: 's2', group: 'g1', lastName: 'Шевченко', firstName: 'Марія' },
    { _id: 's3', group: 'g1', lastName: 'Бондар', firstName: 'Олег' },
    { _id: 's4', group: 'g2', lastName: 'Андрієнко', firstName: 'Софія' },
    { _id: 's5', group: 'g2', lastName: 'Ткаченко', firstName: 'Дарина' },
  ],
  lessons: [
    { _id: 'l1', group: 'g1', date: '2026-06-01', records: [
      { student: 's1', present: true, grade: 10 },
      { student: 's2', present: true, grade: 12 },
      { student: 's3', present: false, grade: null },
    ] },
  ],
};

function db() {
  const raw = localStorage.getItem('dpt_db');
  if (raw) return JSON.parse(raw);
  localStorage.setItem('dpt_db', JSON.stringify(SEED));
  return structuredClone(SEED);
}
function save(data) { localStorage.setItem('dpt_db', JSON.stringify(data)); }
function id() { return 'x' + Math.random().toString(36).slice(2, 9); }

function computeStats(d, groupId) {
  const students = d.students.filter((s) => s.group === groupId);
  const lessons = d.lessons.filter((l) => l.group === groupId);
  return students.map((s) => {
    let absences = 0; const grades = [];
    for (const l of lessons) {
      const r = l.records.find((x) => x.student === s._id);
      if (!r) continue;
      if (!r.present) absences += 1;
      if (r.grade != null) grades.push(r.grade);
    }
    const average = grades.length
      ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100 : null;
    return { studentId: s._id, lastName: s.lastName, firstName: s.firstName, absences, average };
  });
}

// ---------- ПУБЛІЧНИЙ ІНТЕРФЕЙС ----------

export const api = {
  async login(username, password) {
    if (!USE_MOCK) {
      const res = await http('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      token = res.token; localStorage.setItem('token', token);
      return res.user;
    }
    const user = db().users.find((u) => u.username === username && u.password === password);
    if (!user) throw new Error('Невірний логін або пароль');
    return { id: user.id, name: user.name, role: user.role };
  },

  async getGroups() {
    if (!USE_MOCK) return http('/api/groups');
    return db().groups;
  },
  async addGroup(group) {
    if (!USE_MOCK) return http('/api/groups', { method: 'POST', body: JSON.stringify(group) });
    const d = db(); const g = { _id: id(), ...group }; d.groups.push(g); save(d); return g;
  },
  async updateGroup(gid, group) {
    if (!USE_MOCK) return http(`/api/groups/${gid}`, { method: 'PUT', body: JSON.stringify(group) });
    const d = db(); Object.assign(d.groups.find((g) => g._id === gid), group); save(d);
  },
  async deleteGroup(gid) {
    if (!USE_MOCK) return http(`/api/groups/${gid}`, { method: 'DELETE' });
    const d = db();
    d.groups = d.groups.filter((g) => g._id !== gid);
    d.students = d.students.filter((s) => s.group !== gid);
    d.lessons = d.lessons.filter((l) => l.group !== gid);
    save(d);
  },

  async getStudents(gid) {
    if (!USE_MOCK) return http(`/api/groups/${gid}/students`);
    return db().students.filter((s) => s.group === gid);
  },
  async addStudent(student) {
    if (!USE_MOCK) return http('/api/students', { method: 'POST', body: JSON.stringify(student) });
    const d = db(); const s = { _id: id(), ...student }; d.students.push(s); save(d); return s;
  },
  async deleteStudent(sid) {
    if (!USE_MOCK) return http(`/api/students/${sid}`, { method: 'DELETE' });
    const d = db(); d.students = d.students.filter((s) => s._id !== sid); save(d);
  },

  async getStats(gid) {
    if (!USE_MOCK) return http(`/api/groups/${gid}/stats`);
    return computeStats(db(), gid);
  },
  async getLessons(gid) {
    if (!USE_MOCK) return http(`/api/groups/${gid}/lessons`);
    return db().lessons.filter((l) => l.group === gid);
  },
  async saveLesson(lesson) {
    if (!USE_MOCK) return http('/api/lessons', { method: 'POST', body: JSON.stringify(lesson) });
    const d = db();
    const existing = d.lessons.find((l) => l.group === lesson.group && l.date === lesson.date);
    if (existing) existing.records = lesson.records;
    else d.lessons.push({ _id: id(), ...lesson });
    save(d);
  },
  async deleteLesson(lessonId) {
    if (!USE_MOCK) return http(`/api/lessons/${lessonId}`, { method: 'DELETE' });
    const d = db();
    d.lessons = d.lessons.filter((l) => l._id !== lessonId);
    save(d);
  },

  async getUsers() {
    if (!USE_MOCK) return http('/api/admin/users');
    return db().users.map((u) => ({ id: u.id, username: u.username, name: u.name, role: u.role }));
  },
  async addUser(user) {
    if (!USE_MOCK) return http('/api/admin/users', { method: 'POST', body: JSON.stringify(user) });
    const d = db(); const u = { id: id(), ...user }; d.users.push(u); save(d); return u;
  },
  async deleteUser(uid) {
    if (!USE_MOCK) return http(`/api/admin/users/${uid}`, { method: 'DELETE' });
    const d = db(); d.users = d.users.filter((u) => u.id !== uid); save(d);
  },

  async backup() {
    if (!USE_MOCK) return http('/api/admin/backup');
    const d = db(); return { version: 1, exportedAt: new Date().toISOString(), ...d };
  },
  async restore(data) {
    if (!USE_MOCK) return http('/api/admin/restore', { method: 'POST', body: JSON.stringify(data) });
    save({ users: data.users || SEED.users, groups: data.groups || [], students: data.students || [], lessons: data.lessons || [] });
  },
  async reportCsv() {
    if (!USE_MOCK) {
      const res = await fetch(`${API_URL}/api/admin/report.csv`, { headers: { Authorization: `Bearer ${token}` } });
      return res.text();
    }
    const d = db();
    const rows = ['group,lastName,firstName,absences,average'];
    for (const g of d.groups) {
      for (const st of computeStats(d, g._id)) {
        rows.push(`${g.name},${st.lastName},${st.firstName},${st.absences},${st.average ?? ''}`);
      }
    }
    return rows.join('\n');
  },

  logout() { token = null; localStorage.removeItem('token'); },
};
