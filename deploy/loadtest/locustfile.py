# Навантажувальний сценарій Locust для бекенда DanceProgressTracker.
#
# Кожен віртуальний користувач при старті логіниться (отримує JWT) і кешує
# список id груп. Далі в циклі він імітує реальну роботу клієнта: переглядає
# групи, склад груп, статистику відвідуваності, список користувачів і зрідка
# health-check. Ваги завдань (@task(N)) задають частоту звернень.
#
# Запуск з веб-інтерфейсом (http://localhost:8089):
#   locust -f locustfile.py --host http://localhost:4000
#
# Без UI (headless): 400 користувачів, розгін 8/с, 3 хвилини, з вивантаженням CSV:
#   locust -f locustfile.py --host http://localhost:4000 \
#          --headless -u 400 -r 8 -t 3m --csv result
#
# Логін/пароль можна перевизначити через оточення:
#   LOAD_USERNAME=admin LOAD_PASSWORD=admin locust -f locustfile.py --host http://localhost:4000

import os
import random
from locust import HttpUser, task, between

USERNAME = os.getenv("LOAD_USERNAME", "admin")
PASSWORD = os.getenv("LOAD_PASSWORD", "admin")


class DptUser(HttpUser):
    # Пауза між запитами одного користувача — імітація "думання" перед дією.
    wait_time = between(0.2, 0.8)

    def on_start(self):
        """Викликається один раз на старті кожного віртуального користувача."""
        self.token = None
        self.group_ids = []

        # 1) Логін — найдорожчий за CPU запит (перевірка пароля bcrypt + підпис JWT).
        resp = self.client.post(
            "/api/auth/login",
            json={"username": USERNAME, "password": PASSWORD},
            name="POST /api/auth/login",
        )
        if resp.status_code != 200:
            resp.failure(f"login failed: {resp.status_code}")
            return
        self.token = resp.json().get("token")

        # 2) Одноразово кешуємо id груп, щоб далі бити по конкретних групах.
        groups = self.client.get("/api/groups", headers=self._auth(), name="GET /api/groups")
        if groups.status_code == 200:
            self.group_ids = [g.get("_id") for g in groups.json() if g.get("_id")]

    def _auth(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def _rand_group(self):
        return random.choice(self.group_ids) if self.group_ids else None

    @task(6)
    def list_groups(self):
        """Найчастіша операція — перегляд переліку груп (запит у Mongo)."""
        if not self.token:
            return
        self.client.get("/api/groups", headers=self._auth(), name="GET /api/groups")

    @task(3)
    def group_students(self):
        """Склад конкретної групи (учні)."""
        gid = self._rand_group()
        if not gid:
            return
        self.client.get(
            f"/api/groups/{gid}/students",
            headers=self._auth(),
            name="GET /api/groups/[id]/students",
        )

    @task(2)
    def group_stats(self):
        """Статистика відвідуваності/успішності — найважча операція (агрегація у JS)."""
        gid = self._rand_group()
        if not gid:
            return
        self.client.get(
            f"/api/groups/{gid}/stats",
            headers=self._auth(),
            name="GET /api/groups/[id]/stats",
        )

    @task(2)
    def admin_users(self):
        """Адмінський перелік користувачів."""
        if not self.token:
            return
        self.client.get("/api/admin/users", headers=self._auth(), name="GET /api/admin/users")

    @task(1)
    def health(self):
        """Дешевий health-check балансувальника/бекенда."""
        self.client.get("/health", name="GET /health")
