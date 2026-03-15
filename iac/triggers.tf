resource "google_cloudbuild_trigger" "terraform_apply_prod" {
  name        = "terraform-apply-production"
  description = "Apply infrastructure changes to production (requires approval)"
  project     = var.project_id
  location    = var.region

  github {
    owner = var.github_owner
    name  = var.github_repo

    push {
      branch = "^main$"
    }
  }

  included_files = ["iac/**"]
  filename       = "iac/GCP/cloudbuild-apply.yaml"

  service_account = google_service_account.terraform_builder.id

  # Require approval before the build runs
  approval_config {
    approval_required = true
  }
}