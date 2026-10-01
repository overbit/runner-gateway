import unittest

from runner_gateway import evaluate_policy


POLICY = {
    "variable": "CI_PRIVATE_RUNNER",
    "providers": [
        {
            "name": "github",
            "runner": "ubuntu-latest",
            "quota": {
                "type": "minutes",
                "included_minutes": 2000,
                "reserve_minutes": 100,
            },
        },
        {
            "name": "blacksmith",
            "runner": "blacksmith-4vcpu-ubuntu-2404",
            "quota": {
                "type": "minutes",
                "included_minutes": 3000,
                "reserve_minutes": 100,
            },
        },
        {
            "name": "fallback",
            "runner_env": "FALLBACK_RUNNER",
            "quota": {"type": "always"},
        },
    ],
}


class PolicyTests(unittest.TestCase):
    def test_prefers_github_while_above_reserve(self):
        result = evaluate_policy(
            POLICY,
            {"github": 1000, "blacksmith": 0},
            {"FALLBACK_RUNNER": "other-runner"},
        )
        self.assertEqual(result["provider"], "github")

    def test_uses_blacksmith_when_github_reaches_reserve(self):
        result = evaluate_policy(
            POLICY,
            {"github": 1900, "blacksmith": 100},
            {"FALLBACK_RUNNER": "other-runner"},
        )
        self.assertEqual(result["provider"], "blacksmith")

    def test_falls_back_when_both_quotas_are_exhausted(self):
        result = evaluate_policy(
            POLICY,
            {"github": 2000, "blacksmith": 3000},
            {"FALLBACK_RUNNER": "other-runner"},
        )
        self.assertEqual(result["provider"], "fallback")
        self.assertEqual(result["runner"], "other-runner")

    def test_skips_provider_when_usage_is_missing(self):
        result = evaluate_policy(
            POLICY,
            {"github": 2000},
            {"FALLBACK_RUNNER": "other-runner"},
        )
        self.assertEqual(result["provider"], "fallback")
        self.assertEqual(result["providers"][1]["reason"], "usage is unavailable")


if __name__ == "__main__":
    unittest.main()
