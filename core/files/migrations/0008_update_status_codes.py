# Generated manually to update existing status codes

from django.db import migrations


def update_status_codes(apps, schema_editor):
    """Update existing status codes to match new model choices"""
    Audio = apps.get_model('files', 'Audio')
    
    # Update old status codes to new ones
    status_mapping = {
        'P': 'AP',  # Pending -> Awaiting Processing
        'Pr': 'P',  # Processing -> Processing  
        'Pd': 'PD', # Processed -> Processed
        # A, E, R remain the same
    }
    
    for old_status, new_status in status_mapping.items():
        Audio.objects.filter(status=old_status).update(status=new_status)


def reverse_status_codes(apps, schema_editor):
    """Reverse the status code updates"""
    Audio = apps.get_model('files', 'Audio')
    
    # Reverse mapping
    reverse_mapping = {
        'AP': 'P',   # Awaiting Processing -> Pending
        'P': 'Pr',   # Processing -> Processing
        'PD': 'Pd',  # Processed -> Processed
    }
    
    for new_status, old_status in reverse_mapping.items():
        Audio.objects.filter(status=new_status).update(status=old_status)


class Migration(migrations.Migration):

    dependencies = [
        ('files', '0007_add_audio_duration_and_token'),
    ]

    operations = [
        migrations.RunPython(update_status_codes, reverse_status_codes),
    ]
