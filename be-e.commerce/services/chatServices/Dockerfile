FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3007
ENV NODE_ENV=production
ENV PORT=3007

CMD ["npm", "run", "dev"]
