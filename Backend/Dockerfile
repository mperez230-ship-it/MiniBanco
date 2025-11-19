# backend/Dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production --legacy-peer-deps
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
