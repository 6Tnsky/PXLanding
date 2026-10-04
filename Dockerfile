# Статический лендинг «Параграfикс» на nginx.
# Timeweb App Platform: фреймворк «Dockerfile», «Путь к директории проекта» — пусто.
# EXPOSE обязателен: без него платформа по умолчанию ждёт порт 8080.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY style.css  /usr/share/nginx/html/style.css
COPY app.js     /usr/share/nginx/html/app.js
COPY assets     /usr/share/nginx/html/assets

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
