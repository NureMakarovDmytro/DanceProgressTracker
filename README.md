# DanceProgressTracker

Програмна система для контролю відвідуваності та успішності учнів танцювальних
шкіл. Дисципліна «Архітектура програмного забезпечення», ПЗПІ-23-7, Макаров Дмитро.

Клієнт-серверна архітектура: спільне серверне ядро (REST API) обслуговує веб- і
мобільний клієнти; ролі — **Адміністратор** та **Викладач**.

```
DanceProgressTracker/
├── backend/    Серверне ядро — Node.js (Express) + MongoDB + JWT (REST API)
├── web/        Веб-клієнт — React (Vite), ролі admin/teacher, i18n uk/en   [ЛР3]
├── mobile/     Мобільний клієнт — Android, Kotlin, Jetpack Compose          [ЛР2]
└── deploy/     Контейнеризація та масштабування — Docker, Kubernetes, k6     [ЛР4]
```

## Стек

| Частина  | Технології |
|----------|------------|
| Backend  | Node.js, Express, MongoDB (Mongoose), JWT, bcrypt |
| Web      | React, React Router, i18next, Vite |
| Mobile   | Kotlin, Jetpack Compose, Retrofit, Moshi |
| Deploy   | Docker, Kubernetes (Deployment, Service, HPA, Ingress), k6 / Locust |

## Швидкий старт (backend + web)

```bash
# 1. Backend
cd backend && npm install && npm run seed && npm start   # :4000

# 2. Web (в іншому терміналі)
cd web && npm install && npm run dev                      # :5173
```

Демо-доступи: `admin/admin` (адміністратор), `teacher/teacher` (викладач).

Веб-клієнт за замовчуванням працює в демо-режимі (localStorage). Для роботи з
реальним бекендом задайте `VITE_API_URL=http://localhost:4000`.

## Лабораторні роботи

- **ЛР1** — доопрацювання Vision & Scope (документ).
- **ЛР2** — мобільний застосунок (`mobile/`).
- **ЛР3** — веб-застосунок (`web/`).
- **ЛР4** — масштабування бекенда (`deploy/`).
- **ЛР5** — підсумкова презентація проєкту.
