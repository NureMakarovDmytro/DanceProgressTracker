# Locust-альтернатива до k6 (loadtest.js) — той самий сценарій:
# при старті користувача логінимось і отримуємо JWT, далі в циклі б'ємо
# GET /api/groups (основне навантаження) і зрідка GET /health.
#
# Запуск з веб-інтерфейсом (відкрити http://localhost:8089):
#   locust -f locustfile.py --host http://dpt.local
#
# Запуск без UI (headless), 100 користувачів, розгін 5/с, 3 хвилини:
#   locust -f locustfile.py --host http://dpt.local \
#          --headless -u 100 -r 5 -t 3m --csv result
#
# Логін/пароль можна перевизначити через оточення:
#   LOAD_USERNAME=admin LOAD_PASSWORD=admin locust -f locustfile.py --host http://dpt.local

import os
import random
from locust import HttpUser, task, between

USERNAME = os.getenv("LOAD_USERNAME", "admin")
PASSWORD = os.getenv("LOAD_PASSWORD", "admin")


class DptUser(HttpUser):
    # Пауза між запитами одного користувача (імітація "думання").
    wait_time = between(0.3, 0.7)

    def on_start(self):
        """Викликається один раз при старті кожного віртуального користувача — логін."""
        resp = self.client.post(
            "/api/auth/login",
            json={"username": USERNAME, "password": PASSWORD},
            name="POST /api/auth/login",
        )
        if resp.status_code == 200:
            self.token = resp.json().get("token")
        else:
            self.token = None
            resp.failure(f"login failed: {resp.status_code}")

    @task(5)
    def list_groups(self):
        """Основне навантаження: читання списку груп (потребує токен + запит у Mongo)."""
        if not self.token:
            return
        self.client.get(
            "/api/groups",
            headers={"Authorization": f"Bearer {self.token}"},
            name="GET /api/groups",
        )

    @task(1)
    def health(self):
        """Дешевий health-check — інколи (вага 1 проти 5)."""
        self.client.get("/health", name="GET /health")
