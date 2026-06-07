# DanceProgressTracker — Mobile (Android)

Мобільний клієнт системи **DanceProgressTracker** — обліку відвідуваності та
оцінок учнів танцювальних шкіл. Застосунок призначений для викладача: він
дозволяє відмічати присутність та виставляти оцінки прямо з телефона.
Дані зберігаються на існуючому REST-бекенді системи.

## Місце в системі

```
[ Android-клієнт ]  --HTTP/JSON-->  [ REST API (DanceProgressTracker backend) ]  -->  [ База даних ]
```

Мобільний застосунок — лише презентаційний клієнт. Уся бізнес-логіка
(зберігання занять, підрахунок пропусків і середнього балу) лишається на
бекенді. Клієнт автентифікується через JWT і викликає ті самі ендпоінти, що й
веб-частина системи.

## Архітектура (MVVM)

```
Composable (UI)  ->  AppViewModel (StateFlow)  ->  Repository  ->  ApiService (Retrofit)  ->  Backend
```

- **UI (Jetpack Compose, Material 3)** — екрани `LoginScreen`, `GroupsScreen`,
  `AttendanceScreen`, `StatsScreen`. Лише відображають стан і надсилають події.
- **ViewModel** (`AppViewModel`) — тримає стан застосунку у `StateFlow`,
  обробляє завантаження/помилки, викликає репозиторій у `viewModelScope`.
- **Repository** (`Repository`) — єдина точка доступу до даних, зберігає JWT
  у пам'яті (in-memory) та додає заголовок `Authorization: Bearer <token>`.
- **Network** (`ApiService`, `RetrofitClient`, `Models`) — Retrofit + Moshi +
  OkHttp logging; описує контракт REST API.

## REST API

Базовий URL: `http://10.0.2.2:4000/api/` (константа в `RetrofitClient`;
`10.0.2.2` — це localhost хост-машини з точки зору Android-емулятора).

| Метод | Шлях | Призначення |
|-------|------|-------------|
| POST | `/auth/login` | вхід, повертає `{token, user}` |
| GET | `/groups` | список груп |
| GET | `/groups/{id}/students` | учні групи |
| GET | `/groups/{id}/stats` | пропуски + середній бал |
| POST | `/lessons` | створення заняття (відвідуваність + оцінки) |

## Як зібрати та запустити

1. Запустіть бекенд DanceProgressTracker локально на порту `4000`.
2. Відкрийте теку `mobile/` в Android Studio (Gradle Kotlin DSL).
3. За потреби змініть `BASE_URL` у
   `app/src/main/java/com/dpt/mobile/network/RetrofitClient.kt`
   (для фізичного пристрою — IP машини з бекендом).
4. Запустіть на емуляторі (API 24+) кнопкою **Run**.
5. Увійдіть як викладач, оберіть групу, відмітьте відвідуваність/оцінки і
   натисніть **Зберегти заняття**.

## Технології

- Kotlin, Jetpack Compose (Material 3), single-activity
- MVVM + `StateFlow`
- Retrofit + Moshi + OkHttp logging
- Navigation Compose
- minSdk 24, compile/target SDK 34, Gradle Kotlin DSL
