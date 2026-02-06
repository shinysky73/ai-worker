FROM node:20-slim AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/user-client/package.json ./apps/user-client/
RUN pnpm install --frozen-lockfile

COPY apps/user-client ./apps/user-client
RUN pnpm --filter user-client build

FROM nginx:alpine
COPY --from=builder /app/apps/user-client/dist /usr/share/nginx/html
COPY apps/user-client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
