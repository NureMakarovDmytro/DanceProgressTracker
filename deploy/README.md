# ЛР4 — Масштабування бекенда DanceProgressTracker

Інфраструктура для **горизонтального масштабування** REST API (Node.js + Express + MongoDB).
Сам бекенд (`../backend`) не змінювався — масштабування досягається виключно засобами
розгортання та оркестрації. Реалізовано два взаємодоповнювальні варіанти:

- **`compose/` — Docker Compose + Nginx** (round-robin): простий запуск кількох копій
  бекенда командою `docker compose up --scale backend=N`. Саме цей варіант описано у звіті ЛР4.
- **`k8s/` — Kubernetes**: Deployment + Service + HorizontalPodAutoscaler + Ingress із
  автоматичним масштабуванням за CPU (нижче).

```
                         ┌──────────────────────────┐
   HTTP-клієнти ───────▶ │  Ingress (nginx) / LB     │   ← одна точка входу
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │  Service backend (ClusterIP)│  ← балансування round-robin
                         └──┬─────────┬─────────┬─────┘
                            │         │         │
                       ┌────▼──┐ ┌────▼──┐ ┌────▼──┐   ← 2..10 ІДЕНТИЧНИХ stateless pod-ів
                       │ API#1 │ │ API#2 │ │ API#N │     (масштабує HPA за CPU)
                       └────┬──┘ └────┬──┘ └────┬──┘
                            └─────────┼─────────┘
                                ┌─────▼─────┐
                                │  MongoDB  │           ← ОДИН stateful-екземпляр + PVC
                                └───────────┘
```

## 1. Обрана стратегія масштабування

- **Горизонтальне масштабування шару API** (scale-out): замість потужнішої машини
  запускаємо багато однакових pod-ів за спільним балансувальником. Кількістю реплік
  керує HPA автоматично або інженер вручну через `kubectl scale`.
- **MongoDB лишається одним stateful-сервісом** із постійним томом (PVC). База
  навмисно не масштабується горизонтально в межах ЛР.
- Як **майбутній крок** для масштабування БД: вертикальне масштабування (більше CPU/RAM
  екземпляру Mongo) або перехід на **replica set / sharding** для розподілу читань і записів.

## 2. Чому API горизонтально масштабований

API спроєктований **stateless**:
- автентифікація через **JWT** — токен самодостатній, перевіряється підписом, не потребує
  серверної сесії;
- немає стану в пам'яті процесу (жодних in-memory сесій, кешів, що належать клієнту);
- усі pod-и **ідентичні**, а весь спільний стан винесено в окрему MongoDB.

Тому будь-який запит може обробити будь-який pod, а додавання/видалення реплік не
впливає на коректність — лише на пропускну здатність.

## 3. Як працює демонстрація

1. `Service backend` (ClusterIP) розподіляє вхідні запити між усіма **готовими** pod-ами
   (round-robin через kube-proxy). Готовність визначає `readinessProbe` на `/health`.
2. `kubectl scale` або **HPA** змінюють кількість реплік. HPA дивиться на середнє CPU
   (ціль 60%) і тримає від 2 до 10 pod-ів.
3. Під час навантажувального тесту збільшення кількості pod-ів **підвищує сумарний RPS,
   який система витримує, приблизно лінійно** — доти, доки вузьким місцем не стане
   єдина MongoDB (або мережа).

## 4. Команди для демонстрації

```bash
# 0) Зібрати образ бекенда (контекст — каталог backend)
docker build -f docker/Dockerfile -t dpt-backend:latest ../backend
#    для minikube: minikube image load dpt-backend:latest

# 1) Створити namespace і секрети
kubectl apply -f k8s/namespace.yaml
kubectl -n dpt create secret generic backend-secret --from-literal=jwt-secret='change-me'
#    (або: kubectl apply -f k8s/secret.example.yaml)

# 2) Розгорнути базу та API
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/backend-hpa.yaml
kubectl apply -f k8s/ingress.yaml        # АБО k8s/loadbalancer.yaml

# 3) Наповнити базу демоданими (логін admin/admin)
kubectl -n dpt exec deploy/backend -- node src/seed.js

# 4) Перевірити стан
kubectl -n dpt get pods,svc,hpa
kubectl -n dpt get hpa backend --watch     # спостерігати автомасштабування

# 5) Доступ для тесту (найпростіше — port-forward)
kubectl -n dpt port-forward svc/backend 8080:80

# 6) Масштабувати вручну та заміряти RPS (див. loadtest/README.md)
kubectl -n dpt scale deployment/backend --replicas=2
kubectl -n dpt scale deployment/backend --replicas=6

# 7) Прибрати все
kubectl delete namespace dpt
```

## Структура каталогу

- `docker/` — `Dockerfile` + `.dockerignore` для образу бекенда.
- `compose/` — `docker-compose.yml` + `nginx/nginx.conf` для масштабування через Docker Compose.
- `k8s/` — маніфести Kubernetes (namespace, mongo, deployment, service, hpa, ingress/lb, secrets).
- `loadtest/` — навантажувальні тести (Locust + k6), методика замірів і результати (`results/`).
