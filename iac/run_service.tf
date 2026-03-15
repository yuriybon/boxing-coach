resource "google_service_account" "cloud_run_sa" {
  account_id   = "boxing-coach-run-sa"
  display_name = "Cloud Run Runtime Service Account"
}

# Define the secrets so Terraform creates them empty and we can grant permissions
locals {
  secrets = [
    "GEMINI_API_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SESSION_SECRET"
  ]
}

resource "google_secret_manager_secret" "app_secrets" {
  for_each  = toset(local.secrets)
  secret_id = each.key

  replication {
    auto {}
  }
}

# Allow the Cloud Run Service Account to read the secrets
resource "google_secret_manager_secret_iam_member" "secret_accessor" {
  for_each  = toset(local.secrets)
  project   = var.project_id
  secret_id = google_secret_manager_secret.app_secrets[each.key].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}