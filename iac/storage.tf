resource "google_storage_bucket" "terraform_state" {
  name          = var.state_bucket_name
  location      = var.region
  force_destroy = false

  versioning {
    enabled = true
  }

  public_access_prevention = "enforced"
}