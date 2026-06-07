# Навантажувальне тестування DanceProgressTracker

Тут два взаємозамінні інструменти для одного й того ж сценарію:
**логін один раз -> отримати JWT -> у циклі читати `GET /api/groups` (+ зрідка `/health`)**.
Мета — показати, що зі збільшенням кількості pod-ів API зростає пропускна здатність (RPS).

## Передумови

1. API доступний за деякою URL (`BASE_URL`). Варіанти:
   - через Ingress: `http://dpt.local` (додайте host у `/etc/hosts`);
   - через `kubectl port-forward -n dpt svc/backend 8080:80` -> `http://localhost:8080`;
   - через LoadBalancer/`minikube tunnel`.
2. У базі є користувач для логіну. Сід створює `admin/admin`:
   `npm run seed` у каталозі `backend` (з відповідним `MONGO_URI`).

## Варіант A — k6

Встановлення: `brew install k6` (macOS) або див. https://k6.io/docs/get-started/installation/

```bash
k6 run -e BASE_URL=http://localhost:8080 -e USERNAME=admin -e PASSWORD=admin loadtest.js
```

Сценарій: `ramping-vus` 0 -> 50 -> 100 VU за ~2.3 хв, із порогами:
- `http_req_duration p(95) < 800ms`
- `http_req_failed rate < 1%`

## Варіант B — Locust

Встановлення: `pip install locust`

```bash
# З веб-інтерфейсом (http://localhost:8089):
locust -f locustfile.py --host http://localhost:8080

# Без UI, 100 користувачів, 3 хв, з вивантаженням CSV:
locust -f locustfile.py --host http://localhost:8080 --headless -u 100 -r 5 -t 3m --csv result
```

## Які метрики фіксувати для звіту

| Метрика | k6 | Locust | Що показує |
|---|---|---|---|
| Пропускна здатність (RPS) | `http_reqs` (rate) | `Requests/s` (Aggregated) | головний показник масштабування |
| Затримка p95 | `http_req_duration p(95)` | `95%ile` | чи деградує час відповіді під навантаженням |
| Частка помилок | `http_req_failed` | `Failures` / `% failed` | чи система ще справляється |

## Методика демонстрації масштабування

Прогнати тест ТРИЧІ з тим самим навантаженням, змінюючи лише кількість pod-ів API,
і щоразу занотувати RPS та p95:

```bash
# Прогін 1: 2 pod-и
kubectl -n dpt scale deployment/backend --replicas=2
k6 run -e BASE_URL=http://localhost:8080 loadtest.js

# Прогін 2: 4 pod-и
kubectl -n dpt scale deployment/backend --replicas=4
k6 run -e BASE_URL=http://localhost:8080 loadtest.js

# Прогін 3: 6 pod-ів
kubectl -n dpt scale deployment/backend --replicas=6
k6 run -e BASE_URL=http://localhost:8080 loadtest.js
```

Очікувано: RPS зростає приблизно лінійно з кількістю pod-ів, поки вузьким місцем
не стане єдина MongoDB. Зведіть результати в таблицю `replicas -> RPS -> p95`
і додайте графік — це і є доказ зв'язку «кількість pod-ів ↔ пропускна здатність».
