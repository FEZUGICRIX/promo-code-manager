FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm@8.15.0

# 1. Копируем файлы манифеста монорепозитория из КОРНЯ
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# 2. Копируем package.json конкретного сервиса в его папку
COPY frontend/package.json ./frontend/

# 3. Устанавливаем зависимости только для бэкенда (используя общий лок-файл)
# Флаг --filter позволяет не ставить лишнее из фронтенда
RUN pnpm install --filter ./frontend --frozen-lockfile

# 4. Копируем исходный код бэкенда
COPY frontend ./frontend

# 5. Переходим в папку сервиса для сборки и запуска
WORKDIR /app/frontend

RUN pnpm run build

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host"]
