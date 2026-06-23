FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL
ENV HUSKY=0
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/frontend ./apps/frontend
RUN npm ci --workspace=@earthquake/shared-types --workspace=@earthquake/shared-utils --workspace=@earthquake/frontend --include-workspace-root
RUN npm run build -w @earthquake/shared-types
RUN npm run build -w @earthquake/shared-utils
RUN npm run build -w @earthquake/frontend

FROM nginx:1.27-alpine AS runner
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
