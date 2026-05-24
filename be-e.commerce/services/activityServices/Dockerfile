FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3004
ENV NODE_ENV=production
ENV PORT=3004

CMD ["node", "dist/index.js"]