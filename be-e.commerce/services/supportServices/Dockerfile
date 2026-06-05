FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3009
ENV NODE_ENV=production
ENV PORT=3009

CMD ["npm", "run", "dev"]
