import string
import random
from locust import HttpUser, between, task, FastHttpUser


class ReplayCheckUser(FastHttpUser):
    @task
    def checkIDs(self):
        self.client.put("/", json=getRandomReportIDs(20))

def getRandomReportIDs(count):
    return {"reportIDs": [''.join(random.choice(string.ascii_letters) for i in range(16)) for j in range(count)]}
