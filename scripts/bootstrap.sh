#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"

org="${GATEWAY_ORG:-${GITHUB_REPOSITORY_OWNER:-}}"
variable_name="${RUNNER_VARIABLE:-CI_PRIVATE_RUNNER}"
default_runner="${GITHUB_DEFAULT_RUNNER:-ubuntu-latest}"
api_version="2026-03-10"

if [[ -z "$org" ]]; then
  echo "GATEWAY_ORG or GITHUB_REPOSITORY_OWNER is required" >&2
  exit 1
fi

echo "Verifying billing access for $org"
gh api   -H "Accept: application/vnd.github+json"   -H "X-GitHub-Api-Version: $api_version"   "/organizations/$org/settings/billing/usage/summary" >/dev/null

echo "Checking organization variable $variable_name"
if gh api   -H "Accept: application/vnd.github+json"   -H "X-GitHub-Api-Version: $api_version"   "/orgs/$org/actions/variables/$variable_name" >/dev/null 2>&1; then
  echo "$variable_name already exists; leaving its value unchanged"
  exit 0
fi

echo "Creating $variable_name=$default_runner with private visibility"
gh api   --method POST   -H "Accept: application/vnd.github+json"   -H "X-GitHub-Api-Version: $api_version"   "/orgs/$org/actions/variables"   -f "name=$variable_name"   -f "value=$default_runner"   -f "visibility=private" >/dev/null

echo "Bootstrap complete"
