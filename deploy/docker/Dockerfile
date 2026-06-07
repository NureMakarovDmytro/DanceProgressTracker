# Dockerfile для бекенда DanceProgressTracker (Node.js + Express).
# Образ збирається з вмісту каталогу ../backend (див. контекст у командах build нижче).
#
# Збірка (з каталогу deploy/docker, контекст — каталог backend):
#   docker build -f Dockerfile -t dpt-backend:latest ../../backend
# Локальний запуск:
#   docker run -p 4000:4000 -e MONGO_URI=mongodb://host.docker.internal:27017/dpt dpt-backend:latest

FROM node:20-alpine

# Робочий каталог усередині контейнера.
WORKDIR /app

# Спочатку копіюємо тільки маніфести залежностей — кращий кеш шарів Docker.
COPY package.json package-lock.json* ./

# Встановлюємо лише production-залежності (без dev).
# Якщо package-lock.json відсутній, npm ci впаде — тоді використайте npm install --omit=dev.
RUN npm ci --omit=dev || npm install --omit=dev

# Копіюємо решту коду застосунку (каталог src тощо).
COPY . .

# Запускаємо не від root для безпеки (користувач node вже є в образі node:alpine).
USER node

# Порт, на якому слухає Express (див. config.js: PORT=4000 за замовчуванням).
EXPOSE 4000

# HEALTHCHECK для Docker: періодично перевіряє ендпоінт /health.
# wget є у складі busybox в alpine.
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:4000/health || exit 1

# Точка входу — стартовий скрипт сервера.
CMD ["node", "src/server.js"]
