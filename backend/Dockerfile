FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci

FROM dependencies AS build

WORKDIR /app

COPY . .

RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
