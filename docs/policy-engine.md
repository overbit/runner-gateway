# Policy engine

The policy engine selects the first configured runner provider that still has quota above its reserve.

Default order:

1. GitHub-hosted `ubuntu-latest`
2. Blacksmith `blacksmith-4vcpu-ubuntu-2404`
3. a fallback runner supplied through `FALLBACK_RUNNER`

## Usage input

Usage collection is intentionally separate from policy evaluation. Pass a JSON file containing used minutes by provider:

```json
{
  "github": 1250,
  "blacksmith": 850
}
```

Evaluate:

```bash
FALLBACK_RUNNER=other-provider-runner \
  python3 runner_gateway.py --usage usage.json
```

The command returns the selected provider, runner label, and the quota state inspected before the decision.

## Quotas

Edit `config/policy.json` for the organization's plan and provider allowances.

The checked-in defaults are:

- GitHub: 2,000 included minutes with a 100-minute reserve.
- Blacksmith: 3,000 minutes with a 100-minute reserve.
- Fallback: always available when `FALLBACK_RUNNER` is set.

GitHub plan allowances vary, so forks must set the GitHub value to their actual plan.

## Usage adapters

Provider usage is kept outside the selector so each provider can use the best available source.

For GitHub, use the organization billing usage summary endpoint and aggregate Actions usage for the current billing period.

Blacksmith currently advertises 3,000 free minutes per month, but a public documented API for remaining free usage has not been identified. Until an API is available, the Blacksmith usage adapter should supply measured usage from an authoritative source or explicitly skip Blacksmith when usage is unknown.

Unknown usage never counts as available quota: the engine skips that provider and evaluates the next rule.

## Scheduling

Do not use a public GitHub-hosted workflow as a persistent cron service for the gateway. Run collection + evaluation + organization-variable update from an external scheduler such as a systemd timer, container cron, Lambda/EventBridge, or Cloud Run job.

A public repository can still hold the source and be forked into each organization.
