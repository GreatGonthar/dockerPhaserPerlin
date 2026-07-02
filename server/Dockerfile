FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc -p tsconfig.json
EXPOSE 3001
CMD ["node", "dist/index.js"]