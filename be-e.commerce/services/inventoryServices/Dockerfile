FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Cài tất cả deps kể cả devDependencies (cần nodemon, ts-node)
RUN npm install

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3003

CMD ["npm", "run", "dev"]