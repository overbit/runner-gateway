# GitHub App setup

Create one GitHub App for each organization that deploys runner-gateway.

## Required permissions

Under **Organization permissions**, grant:

| Permission | Access | Purpose |
| --- | --- | --- |
| Administration | Read-only | Read organization billing usage |
| Variables | Read and write | Create/update `CI_PRIVATE_RUNNER` |

No repository write permission is required.

## Create and install the App

1. In the target organization, open **Settings → Developer settings → GitHub Apps → New GitHub App**.
2. Give the App a unique name, for example `<org>-runner-gateway`.
3. Disable webhooks; this implementation is schedule-driven.
4. Set the organization permissions listed above.
5. Create the App.
6. Install it on the organization. The gateway only needs organization-level APIs, so repository selection can remain minimal.
7. Generate a private key.

## Configure the fork

In the forked `runner-gateway` repository:

- Repository variable `APP_CLIENT_ID`: the App client ID.
- Repository secret `APP_PRIVATE_KEY`: the generated PEM private key.

Do not commit the private key.

## Verify

Run **Actions → Runner Gateway → Run workflow**.

A successful bootstrap will:

1. create a short-lived GitHub App installation token;
2. verify access to the organization billing usage endpoint;
3. read the organization Actions variable API;
4. create `CI_PRIVATE_RUNNER` with value `ubuntu-latest` and visibility `private` when it does not already exist.

Existing values are never overwritten by the bootstrap script.
