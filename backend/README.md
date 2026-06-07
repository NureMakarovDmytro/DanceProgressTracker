# DanceProgressTracker — Backend (REST API)

Node.js (Express) + MongoDB (Mongoose) + JWT. Спільне ядро системи: до нього
звертаються веб-клієнт (ЛР3) і мобільний застосунок (ЛР2); масштабується в ЛР4.

## Запуск

```bash
npm install
cp .env.example .env        # за потреби змінити MONGO_URI / JWT_SECRET
npm run seed                # демо-дані (admin/admin, teacher/teacher)
npm start                   # http://localhost:4000
```

## API

Усі захищені маршрути потребують заголовка `Authorization: Bearer <token>`.

| Метод  | Шлях                       | Роль      | Опис |
|--------|----------------------------|-----------|------|
| POST   | `/api/auth/login`          | —         | Вхід, повертає `{ token, user }` |
| GET    | `/api/groups`              | будь-яка  | Перелік груп |
| POST   | `/api/groups`              | admin     | Створити групу |
| PUT    | `/api/groups/:id`          | admin     | Редагувати групу |
| DELETE | `/api/groups/:id`          | admin     | Видалити групу |
| GET    | `/api/groups/:id/students` | будь-яка  | Учні групи |
| GET    | `/api/groups/:id/lessons`  | будь-яка  | Заняття групи |
| GET    | `/api/groups/:id/stats`    | будь-яка  | Пропуски та середній бал |
| POST   | `/api/students`            | admin     | Додати учня |
| PUT    | `/api/students/:id`        | admin     | Редагувати учня |
| DELETE | `/api/students/:id`        | admin     | Видалити учня |
| POST   | `/api/lessons`             | teacher   | Зафіксувати заняття (відвідуваність + оцінки) |
| GET    | `/api/admin/users`         | admin     | Користувачі |
| POST   | `/api/admin/users`         | admin     | Створити користувача |
| DELETE | `/api/admin/users/:id`     | admin     | Видалити користувача |
| GET    | `/api/admin/backup`        | admin     | Резервна копія (JSON) |
| POST   | `/api/admin/restore`       | admin     | Відновлення з копії |
| GET    | `/api/admin/report.csv`    | admin     | Зведений звіт (CSV) |
| GET    | `/health`                  | —         | Health-check для LB / K8s |

## Структура

```
src/
  models/      User, Group, Student, Lesson (Mongoose-схеми)
  routes/      auth, groups, students, lessons, admin
  middleware/  auth.js (JWT + перевірка ролі)
  app.js       складання Express-застосунку
  server.js    точка входу (підключення Mongo + listen)
  seed.js      демонстраційні дані
```
