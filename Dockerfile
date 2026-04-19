# Используем официальный образ Node.js 20
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json (если существует)
COPY package.json ./
COPY package-lock.json* ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем остальные файлы проекта
COPY . .

# Создаем директорию для логов (если нужно)
RUN mkdir -p /app/logs

# Открываем порт 3000
EXPOSE 3000

# Запускаем приложение
CMD ["node", "server.js"]
