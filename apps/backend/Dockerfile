FROM node:22-alpine AS builder
WORKDIR /app
ENV HUSKY=0
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend
RUN npm ci --workspace=@earthquake/shared-types --workspace=@earthquake/shared-utils --workspace=@earthquake/backend --include-workspace-root
RUN npm run build -w @earthquake/shared-types
RUN npm run build -w @earthquake/shared-utils
RUN npm run build -w @earthquake/backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HUSKY=0
COPY package.json package-lock.json* ./
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/packages/shared-utils/package.json ./packages/shared-utils/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
RUN npm ci --omit=dev --ignore-scripts --workspace=@earthquake/shared-types --workspace=@earthquake/shared-utils --workspace=@earthquake/backend --include-workspace-root
EXPOSE 3005
CMD ["node", "apps/backend/dist/index.js"]
