output "project_id" {
  description = "The Vercel project ID. Consumed by the GitHub Actions deploy step (and matches the VERCEL_PROJECT_ID secret)."
  value       = vercel_project.app.id
}

output "project_name" {
  description = "The Vercel project name."
  value       = vercel_project.app.name
}
