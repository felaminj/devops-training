terraform {
  required_version = ">= 1.6.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.0"
    }
  }

  # --- Remote state (HCP Terraform / Terraform Cloud) -----------------------
  # Persists state across GitHub Actions runs so re-runs are idempotent.
  # The workspace must use "Local" execution mode (Terraform runs in CI,
  # state is stored remotely). Auth comes from the TF_API_TOKEN secret.
  cloud {
    organization = "felaminj-devops"
    workspaces {
      name = "earthquake-monitoring-dashboard"
    }
  }
  # --------------------------------------------------------------------------
}

provider "vercel" {
  # Read from the VERCEL_API_TOKEN env var, or TF_VAR_vercel_api_token.
  api_token = var.vercel_api_token

  # Leave vercel_team_id empty ("") for a personal/Hobby account.
  # Set it (e.g. "team_xxx") only if the project lives under a Vercel Team.
  team = var.vercel_team_id != "" ? var.vercel_team_id : null
}
