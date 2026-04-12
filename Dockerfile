FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.output ./output
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["node", "./output/server/index.mjs"]
