FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host"]
