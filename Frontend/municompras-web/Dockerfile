FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8443

CMD ["npm", "run", "dev"]
