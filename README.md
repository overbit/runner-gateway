# runner-gateway

Policy-based GitHub Actions runner routing across GitHub-hosted and third-party providers based on repository visibility, quota availability, and fallback rules.

## Deployment model

Each organization forks this repository into the organization. The fork runs a scheduled public-repository workflow and authenticates to its organization through a dedicated GitHub App installation.

The GitHub App needs only:

- **Organization Administration: read** — read organization billing usage.
- **Organization Variables: read and write** — create and update the runner routing variable.

The gateway manages an organization Actions variable named `CI_PRIVATE_RUNNER` with `private` visibility. Application repositories can then use:

```yaml
runs-on: ${{ vars.CI_PRIVATE_RUNNER || 'ubuntu-latest' }}
```

Public repositories do not receive the private-only organization variable and therefore remain on GitHub-hosted `ubuntu-latest`.

## Bootstrap

1. Fork this repository into the organization that should be managed.
2. Create and install a GitHub App for that organization by following [docs/github-app.md](docs/github-app.md).
3. Add the App client ID as repository variable `APP_CLIENT_ID`.
4. Add the App private key as repository secret `APP_PRIVATE_KEY`.
5. Run **Runner Gateway** manually once from the Actions tab.

The first run verifies billing access and creates `CI_PRIVATE_RUNNER=ubuntu-latest` if the variable does not exist.

## Status

The first implementation slice provides secure GitHub App authentication and organization-variable bootstrap. Provider quota evaluation and fallback routing come next.

## Project guide

The single-page developer guide lives in `site/`. It uses static HTML, CSS, and JavaScript with self-hosted fonts and no runtime dependencies.

Preview locally with Node.js and `pnpm start`, then open `http://127.0.0.1:4173`. No package installation is needed. Alternatively, run `python3 -m http.server 4173 --directory site`.

To publish, select **GitHub Actions** under **Settings → Pages → Build and deployment → Source** in the repository, then run **Deploy project guide** or push a change to `site/` on `main`. The Pages workflow publishes only `site/`; it does not publish source credentials or development design notes. Adding these files alone does not enable Pages or create a remote deployment.
