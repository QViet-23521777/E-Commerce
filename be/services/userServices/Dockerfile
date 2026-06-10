FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/index.js"]