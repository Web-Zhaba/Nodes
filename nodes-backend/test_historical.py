import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from engine.models import Node, Impulse, Profile
from engine.services import DECAY_RATE_PER_DAY, calculate_pulse_impact, MAX_STABILITY
from django.utils import timezone
from datetime import timedelta

def test():
    user = Profile.objects.first()
    days = 30
    today = timezone.now().date()
    limit_date = today - timedelta(days=days)

    user_nodes = Node.objects.filter(user=user).values('id', 'name', 'color', 'target_value')
    
    all_impulses = list(Impulse.objects.filter(node__user=user).select_related('node').order_by('completed_at'))
    
    node_impulses = {}
    for imp in all_impulses:
        node_impulses.setdefault(imp.node_id, []).append(imp)
        
    stability_series = []
    
    for n in user_nodes:
        n_id = n['id']
        t_val = float(n['target_value'] or 0)
        imps = node_impulses.get(n_id, [])
        
        current_stability = 0.0
        
        # Split impulses into pre-limit and post-limit
        pre_limit = [i for i in imps if i.completed_at < limit_date]
        post_limit_dict = {}
        for i in [i for i in imps if i.completed_at >= limit_date]:
            post_limit_dict.setdefault(i.completed_at, []).append(i)
            
        # Calc initial stability
        if pre_limit:
            last_date = pre_limit[0].completed_at
            for p in pre_limit:
                days_passed = (p.completed_at - last_date).days
                if days_passed > 0:
                    current_stability *= (1 - DECAY_RATE_PER_DAY) ** days_passed
                current_stability += calculate_pulse_impact(p.value, t_val)
                if current_stability > MAX_STABILITY: current_stability = MAX_STABILITY
                last_date = p.completed_at
                
            # decay up to limit_date
            days_passed = (limit_date - last_date).days
            if days_passed > 0:
                current_stability *= (1 - DECAY_RATE_PER_DAY) ** days_passed
        
        # Now track daily from limit_date to today
        last_date = limit_date
        for day_offset in range((today - limit_date).days + 1):
            current_day = limit_date + timedelta(days=day_offset)
            
            days_passed = (current_day - last_date).days
            if days_passed > 0:
                current_stability *= (1 - DECAY_RATE_PER_DAY) ** days_passed
                
            # Apply impulses for current_day
            day_imps = post_limit_dict.get(current_day, [])
            for p in day_imps:
                current_stability += calculate_pulse_impact(p.value, t_val)
                if current_stability > MAX_STABILITY: current_stability = MAX_STABILITY
                
            last_date = current_day
            
            stability_series.append({
                'date': str(current_day),
                'node_id': str(n_id),
                'stability_score': round(current_stability, 2)
            })
            
    print(len(stability_series), "points generated")
    if stability_series:
        print("Sample:", stability_series[-1])

test()
