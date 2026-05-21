import os
import django
import logging
import sys

# Настройка Django окружения
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from engine.models import Profile, Connector, Node, Recommendation
from engine.recommendations import ContentRecommender

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Diagnostics")

def run_diagnostics():
    target_email = "danya121ender@yandex.ru"
    profiles = Profile.objects.filter(email=target_email)
    if not profiles.exists():
        logger.error(f"User with email {target_email} not found.")
        # Выведем список всех email для справки
        all_emails = Profile.objects.values_list('email', flat=True)
        logger.info(f"Available emails: {list(all_emails)}")
        return

    user = profiles.first()
    logger.info(f"Diagnosing for user: {user.email} ({user.id})")

    # 1. Проверка коннекторов
    connectors = Connector.objects.filter(user=user)
    logger.info(f"Found {connectors.count()} connectors.")
    for c in connectors:
        logger.info(f" - Connector: {c.name}")

    # 2. Проверка весов интересов
    recommender = ContentRecommender(user)
    interests = recommender.get_top_interests()
    logger.info(f"Interests calculation result: {interests}")

    if not interests:
        logger.warning("No interests found! Checking nodes stability...")
        nodes = Node.objects.filter(user=user)
        logger.info(f"Found {nodes.count()} nodes.")
        for n in nodes:
            logger.info(f" - Node: {n.name}, Stability: {n.stability_score}, Pulses: {n.completion_count}")
        
        # Проверка связей Node <-> Connector
        from engine.models import NodeConnector
        nc = NodeConnector.objects.filter(node__user=user)
        logger.info(f"Found {nc.count()} Node-Connector links.")
        return

    # 3. Пробная генерация
    logger.info("Attempting manual recommendation generation...")
    try:
        new_recs = recommender.generate_recommendations()
        if new_recs:
            logger.info(f"Successfully generated {len(new_recs)} recommendations.")
        else:
            logger.warning("Generation returned empty list. Check API keys and provider responses.")
    except Exception as e:
        logger.error(f"Generation failed with error: {e}", exc_info=True)

    # 4. Проверка существующих в БД
    recs_in_db = Recommendation.objects.filter(user=user)
    logger.info(f"Current recommendations in DB: {recs_in_db.count()}")

if __name__ == "__main__":
    run_diagnostics()
