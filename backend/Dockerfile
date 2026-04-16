FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm@8.15.0

# 1. Копируем файлы манифеста монорепозитория из КОРНЯ
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# 2. Копируем package.json конкретного сервиса в его папку
COPY backend/package.json ./backend/

# 3. Устанавливаем зависимости только для бэкенда (используя общий лок-файл)
# Флаг --filter позволяет не ставить лишнее из фронтенда
RUN pnpm install --filter ./backend --frozen-lockfile

# 4. Копируем исходный код бэкенда
COPY backend ./backend

# 5. Переходим в папку сервиса для сборки и запуска
WORKDIR /app/backend

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
