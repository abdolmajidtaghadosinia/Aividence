from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("files", "0006_audio_task_id"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        'ALTER TABLE "files_audio" '
                        'ADD COLUMN IF NOT EXISTS "file_duration" double precision;'
                    ),
                    reverse_sql=(
                        'ALTER TABLE "files_audio" '
                        'DROP COLUMN IF EXISTS "file_duration";'
                    ),
                ),
                migrations.RunSQL(
                    sql=(
                        'ALTER TABLE "files_audio" '
                        'ADD COLUMN IF NOT EXISTS "file_token" varchar(255);'
                    ),
                    reverse_sql=(
                        'ALTER TABLE "files_audio" '
                        'DROP COLUMN IF EXISTS "file_token";'
                    ),
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="audio",
                    name="file_duration",
                    field=models.FloatField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name="audio",
                    name="file_token",
                    field=models.CharField(max_length=255, blank=True, null=True),
                ),
            ],
        )
    ]


