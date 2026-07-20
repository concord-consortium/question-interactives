# Deployment

S3 deployment is handled by GitHub Actions. Pushes are deployed under
`models-resources/question-interactives/` (e.g. `branch/<name>/...`) by the `s3-deploy` job in
[`ci.yml`](../.github/workflows/ci.yml). Releases are promoted by
[`release.yml`](../.github/workflows/release.yml) (via `workflow_dispatch`) by copying each interactive’s
`version/<version>/<interactive>/index-top.html` to `<interactive>/index.html` (or `index-staging.html`).

## AWS Access

The GitHub Actions workflows in this project are allowed to update files in S3 using OIDC. An
IAM role has been created in AWS with a trust policy that allows GitHub Actions in
this specific repository to assume this IAM role. The IAM role has a `RepoName` tag
and a managed policy that uses this tag to give the role permission to update files in
`models-resources/[RepoName]`.

See
[deploy-setup.md in starter-projects](https://github.com/concord-consortium/starter-projects/blob/main/doc/deploy-setup.md)
for how the AWS side is set up.
