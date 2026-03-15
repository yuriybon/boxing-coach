resource "google_service_account" "terraform_builder" {
  account_id   = "terraform-builder"
  display_name = "Terraform Builder Service Account for Cloud Build"
}

resource "google_project_iam_member" "terraform_builder_roles" {
  for_each = toset([
    "roles/cloudbuild.builds.builder",
    "roles/container.developer",
    "roles/storage.admin",
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/secretmanager.admin",
    "roles/artifactregistry.admin",
    "roles/resourcemanager.projectIamAdmin"
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.terraform_builder.email}"
}