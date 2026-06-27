# ---------------------------------------------------------------------------
# Vercel Project (Infrastructure as Code)
#
# This is an npm-workspaces monorepo. We deploy the Vue 3 + Vite app located
# in apps/frontend, but the install/build runs from the repo ROOT so the
# shared packages (@earthquake/shared-types, @earthquake/shared-utils) are
# built first.
# ---------------------------------------------------------------------------
resource "vercel_project" "app" {
  name      = var.project_name
  framework = "vite"

  # Root of the project is the repo root (monorepo). Build emits the SPA into
  # apps/frontend/dist.
  install_command  = "npm ci"
  build_command    = "npm run build -w @earthquake/shared-types && npm run build -w @earthquake/shared-utils && npm run build -w @earthquake/frontend"
  output_directory = "apps/frontend/dist"
}

# ---------------------------------------------------------------------------
# Environment Variables (managed as code, values come from GitHub Secrets)
#
# VITE_ variables are inlined into the client bundle at BUILD time. Because the
# CI pipeline builds via `vercel build`, `vercel pull` first downloads this
# value so the production bundle points at the correct backend API.
# ---------------------------------------------------------------------------
resource "vercel_project_environment_variable" "vite_api_url" {
  project_id = vercel_project.app.id
  key        = "VITE_API_URL"
  value      = var.vite_api_url
  target     = ["production", "preview", "development"]

  # A public client-side URL, not a secret. (Provider >= 4.8.0 requires this
  # to be set explicitly.)
  sensitive = false
}
