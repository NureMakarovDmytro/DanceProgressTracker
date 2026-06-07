// k6 навантажувальний тест для DanceProgressTracker API.
//
// Сценарій:
//   1) setup(): один раз логінимось (POST /api/auth/login) і отримуємо JWT-токен.
//   2) основний потік (ramping VUs): кожен віртуальний користувач у циклі б'є
//      GET /api/groups з Bearer-токеном, плюс зрідка GET /health.
//   3) Навантаження наростає 0 -> 50 -> 100 VU, тримається, потім спадає.
//
// Запуск:
//   k6 run -e BASE_URL=http://dpt.local loadtest.js
//   k6 run -e BASE_URL=http://localhost:8080 -e USERNAME=admin -e PASSWORD=admin loadtest.js
//
// Корисно зафіксувати у звіті: http_reqs (RPS), http_req_duration p95,
// http_req_failed, та КІЛЬКІСТЬ pod-ів під час кожного прогону.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// --- Конфіг через змінні оточення (__ENV) ---
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USERNAME = __ENV.USERNAME || 'admin';
const PASSWORD = __ENV.PASSWORD || 'admin';

// Власна метрика: частка бізнес-помилок (не лише HTTP-код).
const businessErrors = new Rate('business_errors');

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // плавний розгін до 50 VU
        { duration: '60s', target: 100 }, // до 100 VU
        { duration: '30s', target: 100 }, // плато — стабільне навантаження
        { duration: '20s', target: 0 },   // зниження
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // 95-й перцентиль часу відповіді має бути нижчим за 800 мс.
    http_req_duration: ['p(95)<800'],
    // Частка невдалих HTTP-запитів менша за 1%.
    http_req_failed: ['rate<0.01'],
    business_errors: ['rate<0.01'],
  },
};

// setup() виконується один раз до тесту; повертає токен усім VU.
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  const token = res.json('token');
  if (!token) {
    throw new Error(`Не вдалося залогінитись: status=${res.status} body=${res.body}`);
  }
  return { token };
}

// Основний потік — виконується кожним VU у циклі.
export default function (data) {
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  // Головне навантаження — читання списку груп (потребує токен і похід у Mongo).
  const groups = http.get(`${BASE_URL}/api/groups`, authHeaders);
  const okGroups = check(groups, {
    'groups 200': (r) => r.status === 200,
    'groups is array': (r) => Array.isArray(r.json()),
  });
  businessErrors.add(!okGroups);

  // Зрідка (~кожен 5-й ітератор) пінгуємо /health — дешевий ендпоінт.
  if (__ITER % 5 === 0) {
    const health = http.get(`${BASE_URL}/health`);
    check(health, { 'health 200': (r) => r.status === 200 });
  }

  // Невелика пауза, щоб симулювати думання користувача.
  sleep(0.5);
}
