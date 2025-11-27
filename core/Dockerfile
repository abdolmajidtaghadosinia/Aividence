# Start from the Ubuntu 24.04 base image
FROM ubuntu:24.04

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Update and upgrade system packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-full \
    build-essential \
    libpq-dev \
    gettext \
    curl \
    ca-certificates \
    gnupg \
    libsndfile1 \
    libsndfile1-dev \
    libasound2-dev \
    libpulse-dev \
    && \
    # Clean up to reduce image size
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set the working directory for your application
WORKDIR /src/app/

# Create virtual environment
RUN python3 -m venv /opt/venv

# Copy only the requirements file first to leverage Docker cache
# Use the Python 3.12 pinned requirements for consistent builds
COPY requirements-py312.txt ./requirements.txt

# Install Python dependencies in virtual environment
# Ensure build backend is available to avoid 'setuptools.build_meta' errors
RUN /opt/venv/bin/pip install --upgrade pip setuptools wheel && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Add virtual environment to PATH
ENV PATH="/opt/venv/bin:$PATH"

# --- تغییرات جدید برای حل مشکل دسترسی فایل‌ها ---

# فرض می‌کنیم STATIC_ROOT در تنظیمات Django شما به /src/app/staticfiles اشاره می‌کند.
# این دستور تضمین می‌کند که بعد از collectstatic (که در docker-compose اجرا می‌شود)،
# فایل‌های داخل پوشه staticfiles اجازه‌های خواندن و اجرا (برای پوشه‌ها) را برای "دیگران" داشته باشند.
# این خط باید بعد از `COPY . .` و قبل از `CMD` یا `ENTRYPOINT` نهایی قرار گیرد.
# این تضمین می‌کند که فایل‌های کپی شده، حتی قبل از اجرای collectstatic هم، تنظیمات دسترسی پایه را داشته باشند.
# همچنین، از آنجایی که collectstatic فایل‌ها را ایجاد می‌کند، این دستور هر بار که ایمیج ساخته شود،
# یا پس از COPY . . که فایل‌های استاتیک ممکن است وجود داشته باشند، اجرا می‌شود.
RUN chmod -R o+rX /src/app/staticfiles || true

# --- پایان تغییرات جدید ---

# Make start script executable
RUN chmod +x start_gunicorn.sh

# Expose the port your application will listen on
EXPOSE 8000

# Command to run your application when the container starts
CMD ["./start_gunicorn.sh"]