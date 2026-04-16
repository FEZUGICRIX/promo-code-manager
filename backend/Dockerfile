FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
