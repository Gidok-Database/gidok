# Node 20 개발용 이미지
FROM node:20

# 작업 디렉토리
WORKDIR /app

# 의존성 설치용 복사
COPY package.json yarn.lock ./
RUN yarn install

# 나머지 코드 복사
COPY . .

# 포트 개방 (Vite dev server 기본 포트)
EXPOSE 5173

# 개발 서버 실행
CMD ["yarn", "dev", "--host"]
