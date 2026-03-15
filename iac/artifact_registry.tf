resource "google_artifact_registry_repository" "app_repo" {
  location      = var.region
  repository_id = "boxing-coach-repo"
  description   = "Docker repository for Boxing Coach App"
  format        = "DOCKER"
}