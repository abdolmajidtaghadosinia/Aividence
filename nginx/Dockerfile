# از ایمیج رسمی Nginx Alpine استفاده کنید (کم‌حجم و کارآمد)
FROM nginx:alpine

# فایل کانفیگ Nginx سفارشی خود را کپی کنید
COPY nginx.conf /etc/nginx/conf.d/default.conf

# پورت 80 را در معرض قرار دهید
EXPOSE 80

# Nginx را در حالت foreground اجرا کنید
CMD ["nginx", "-g", "daemon off;"]