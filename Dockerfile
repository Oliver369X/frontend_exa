# 1. Instala dependencias en una capa separada (lockfile generado en Linux)
FROM node:20-bullseye AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# 2. Construye la app (build) en otra capa
FROM node:20-bullseye AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Imagen final para producción (runner)
FROM node:20-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXTJS_IGNORE_ESLINT_ERRORS=true
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]