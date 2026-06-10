FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN npm run build
EXPOSE 3006
CMD ["node", "dist/index.js"]
