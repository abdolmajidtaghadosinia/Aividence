#!/bin/bash

# Start Gunicorn with proper configuration
echo "Starting Gunicorn server..."

# Run migrations
python manage.py migrate --no-input

# Create default user
python manage.py create_default_user

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn
exec gunicorn -c gunicorn.conf.py core.wsgi:application

