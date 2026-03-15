terraform {
  backend "gcs" {
    # Replace with your actual GCS bucket name
    bucket = "boxing-coach-terraform-state-bucket-name"
    prefix = "terraform/state"
  }
}