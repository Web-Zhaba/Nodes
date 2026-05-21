import os
import django
import sys
import uuid
from datetime import date

# Настройка Django окружения
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from engine.models import Profile, Connector, Node, NodeConnector, Impulse

def create_test_data():
    profile = Profile.objects.first()
    if not profile:
        print("Error: No profile found.")
        return

    print(f"Using profile: {profile.email}")

    # 1. Создаем коннектор
    connector, created = Connector.objects.get_or_create(
        user=profile,
        name="Программирование",
        defaults={'color': '#6366f1'}
    )
    if created: print("Created connector: Программирование")

    # 2. Создаем узел
    node, created = Node.objects.get_or_create(
        user=profile,
        name="Изучение Python",
        defaults={
            'node_type': 'binary',
            'stability_score': 85.5,
            'completion_count': 10
        }
    )
    if created: print("Created node: Изучение Python")
    else:
        node.stability_score = 85.5
        node.completion_count = 10
        node.save()
        print("Updated node stability and pulses.")

    # 3. Привязываем узел к коннектору
    nc, created = NodeConnector.objects.get_or_create(
        node=node,
        connector=connector
    )
    if created: print("Linked node to connector.")

    # 4. Создаем импульс для надежности
    Impulse.objects.get_or_create(
        node=node,
        completed_at=date.today(),
        defaults={'value': 1}
    )
    print("Added test impulse.")
    print("\n--- DONE ---")
    print("Now run 'venv\\Scripts\\python.exe diagnose_recommendations.py' again.")

if __name__ == "__main__":
    create_test_data()
