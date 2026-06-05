FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3008
ENV NODE_ENV=production
ENV PORT=3008

CMD ["npm", "run", "dev"]
