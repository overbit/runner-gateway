#!/usr/bin/env python3
import argparse
import json
import os


def quota_status(name, included, used, reserve):
    remaining = max(0.0, included - used)
    return {
        "name": name,
        "available": remaining > reserve,
        "included_minutes": included,
        "used_minutes": used,
        "remaining_minutes": remaining,
        "reserve_minutes": reserve,
    }


def resolve_runner(provider, environ):
    if provider.get("runner"):
        return provider["runner"]
    env_name = provider.get("runner_env")
    if env_name and environ.get(env_name):
        return environ[env_name]
    return None


def evaluate_policy(policy, usage, environ=None):
    environ = os.environ if environ is None else environ
    statuses = []

    for provider in policy["providers"]:
        name = provider["name"]
        runner = resolve_runner(provider, environ)
        quota = provider.get("quota", {"type": "always"})
        quota_type = quota.get("type", "always")

        if not runner:
            statuses.append({"name": name, "available": False, "reason": "runner is not configured"})
            continue

        if quota_type == "always":
            status = {"name": name, "available": True, "runner": runner, "reason": "fallback"}
        elif quota_type == "minutes":
            if name not in usage:
                statuses.append({
                    "name": name,
                    "available": False,
                    "runner": runner,
                    "reason": "usage is unavailable",
                })
                continue
            included = float(quota["included_minutes"])
            reserve = float(quota.get("reserve_minutes", 0))
            status = quota_status(name, included, float(usage[name]), reserve)
            status["runner"] = runner
        else:
            raise ValueError(f"{name}: unsupported quota type {quota_type}")

        statuses.append(status)
        if status["available"]:
            return {"provider": name, "runner": runner, "providers": statuses}

    raise RuntimeError(f"no runner provider is available: {json.dumps(statuses)}")


def load_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def main():
    parser = argparse.ArgumentParser(description="Select a GitHub Actions runner from ordered quota rules")
    parser.add_argument("--config", default="config/policy.json")
    parser.add_argument("--usage", required=True, help="JSON file containing used minutes by provider")
    args = parser.parse_args()

    policy = load_json(args.config)
    usage = load_json(args.usage)
    decision = evaluate_policy(policy, usage)
    print(json.dumps(decision, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
