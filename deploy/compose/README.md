# Масштабування через Docker Compose + Nginx

Найпростіший спосіб **горизонтального масштабування** бекенда DanceProgressTracker:
кілька однакових копій контейнера `backend` за балансувальником **Nginx**, спільна
**MongoDB**. Саме цей варіант описано у звіті ЛР4 (альтернатива — Kubernetes у `../k8s`).

```
                       ┌───────────────────────────┐
  web / mobile ──────▶ │  Nginx (LB, :4000 -> :80) │   ← одна зовнішня точка входу
                       └─────────────┬─────────────┘
                          round-robin (Docker DNS)
                ┌─────────────┬──────┴──────┬─────────────┐
            ┌───▼───┐     ┌───▼───┐     ┌───▼───┐
            │backend│     │backend│     │backend│            ← N однакових stateless копій
            └───┬───┘     └───┬───┘     └───┬───┘              (docker compose --scale backend=N)
                └─────────────┼─────────────┘
                        ┌─────▼─────┐
                        │  MongoDB  │                          ← один спільний екземпляр стану
                        └───────────┘
```

## Запуск

```bash
cd deploy/compose

# 1 копія бекенда (базовий рівень, без масштабування)
docker compose up --build

# 3 копії бекенда за балансувальником (горизонтальне масштабування)
docker compose up --build --scale backend=3

# Наповнити базу демо-користувачами (admin/admin, teacher/teacher)
docker compose exec backend npm run seed
```

Клієнти й навантажувальний тест звертаються лише на `http://localhost:4000`.
Перевірити балансувальник: `curl http://localhost:4000/nginx-health`.

## Як це масштабує

- **`backend` — stateless**: автентифікація через самодостатній JWT, жодних серверних
  сесій у пам'яті. Тому будь-яка копія обробляє будь-який запит, а додавання копій не
  ламає коректності — лише підвищує пропускну здатність.
- **Nginx — round-robin** через вбудований DNS Docker: ім'я сервісу `backend` резолвиться
  в усі N контейнерів (див. `nginx/nginx.conf`). Падіння однієї копії → трафік іде на інші.
- **MongoDB — єдине джерело стану**: масштабується тільки шар без стану (API).

## Демонстрація зв'язку «копії ↔ пропускна здатність»

Прогнати той самий навантажувальний тест двічі, змінюючи лише кількість копій:

```bash
# Прогін 1: 1 копія
docker compose up -d --build --scale backend=1
locust -f ../loadtest/locustfile.py --host http://localhost:4000 \
       --headless -u 400 -r 8 -t 3m --csv ../loadtest/results/1-instance

# Прогін 2: 3 копії
docker compose up -d --scale backend=3
locust -f ../loadtest/locustfile.py --host http://localhost:4000 \
       --headless -u 400 -r 8 -t 3m --csv ../loadtest/results/3-instances
```

Зведені результати — у `../loadtest/results/`.
