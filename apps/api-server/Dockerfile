FROM node:20-slim

# LibreOffice와 Poppler 설치
RUN apt-get update && apt-get install -y \
    libreoffice \
    poppler-utils \
    fonts-nanum \
    fonts-nanum-coding \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 의존성 설치
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api-server/package.json ./apps/api-server/
RUN pnpm install --frozen-lockfile

# 소스 복사 및 빌드
COPY apps/api-server ./apps/api-server
RUN pnpm --filter api-server build

# 업로드 디렉토리 생성
RUN mkdir -p /app/uploads/presentations

EXPOSE 3002

CMD ["node", "apps/api-server/dist/main.js"]
