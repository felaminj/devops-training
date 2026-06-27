variable "vercel_api_token" {
  description = "Vercel API token used by Terraform to authenticate. Injected from the GitHub Actions secret VERCEL_TOKEN."
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel Team ID (team_xxx). Leave empty for a personal/Hobby account."
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Name of the Vercel project to provision/manage."
  type        = string
  default     = "earthquake-monitoring-dashboard"
}

variable "vite_api_url" {
  description = "Backend API base URL the frontend talks to. Injected from the GitHub Actions secret VITE_API_URL."
  type        = string
  default     = "http://localhost:3005/api"
}
