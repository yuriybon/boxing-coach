resource "google_cloudbuild_trigger" "app_deploy_prod" {
  name        = "app-deploy-production"
  description = "Build and deploy application on new version tags"
  project     = var.project_id
  location    = var.region

  github {
    owner = var.github_owner
    name  = var.github_repo

    push {
      tag = "^v.*"
    }
  }

  filename = "cloudbuild.yaml"

  service_account = google_service_account.terraform_builder.id

  substitutions = {
    _REGION = var.region
  }
}