"""
GitGuardian Test Suite
Varmistaa, että salaisuudet ja vaaralliset tiedostot havaitaan oikein
eikä turvallinen sisältö tuota vääriä hälytyksiä.
"""

import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.abspath("./src"))

from spacemonkey.git_guardian import scan_file, _scan_filename, _scan_content


class TestGitGuardianFilenames(unittest.TestCase):

    def test_blocks_env_file(self):
        risks = _scan_filename(".env")
        self.assertTrue(any(r.risk_type == "BLOCKED_FILE" for r in risks))

    def test_blocks_env_variant(self):
        risks = _scan_filename("server/.env.production")
        self.assertTrue(any(r.risk_type == "BLOCKED_FILE" for r in risks))

    def test_blocks_private_key_file(self):
        risks = _scan_filename("keys/id_rsa")
        self.assertTrue(any(r.risk_type == "BLOCKED_FILE" for r in risks))

    def test_blocks_credentials_json(self):
        risks = _scan_filename("config/credentials.json")
        self.assertTrue(any(r.risk_type == "BLOCKED_FILE" for r in risks))

    def test_allows_normal_source_file(self):
        risks = _scan_filename("src/spacemonkey/spc_facade.py")
        self.assertEqual(risks, [])


class TestGitGuardianContent(unittest.TestCase):

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.tmpdir.cleanup()

    def _write(self, name: str, content: str) -> str:
        path = os.path.join(self.tmpdir.name, name)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return path

    def test_detects_github_token(self):
        # Rakennetaan pilkottuna, jotta tämä testitiedosto itse ei
        # laukaise Git Guardiania omalla commitillaan.
        fake_token = "ghp_" + "abcdefghijklmnopqrstuvwxyz1234"
        path = self._write("config.js", f'const token = "{fake_token}"')
        risks = _scan_content(path)
        self.assertTrue(any("GitHub token" in r.reason for r in risks))

    def test_detects_aws_key(self):
        fake_key = "AKIA" + "ABCDEFGHIJKLMNOP"
        path = self._write("deploy.sh", f"AWS_KEY={fake_key}")
        risks = _scan_content(path)
        self.assertTrue(any("AWS access key" in r.reason for r in risks))

    def test_detects_private_key_block(self):
        marker = "-----BEGIN " + "RSA PRIVATE KEY-----"
        path = self._write("id_backup.txt", f"{marker}\nMIIEow==\n-----END RSA PRIVATE KEY-----")
        risks = _scan_content(path)
        self.assertTrue(any("Private key block" in r.reason for r in risks))

    def test_clean_file_produces_no_risk(self):
        path = self._write("readme.md", "This project uses Spacemonkey for automation.")
        risks = _scan_content(path)
        self.assertEqual(risks, [])

    def test_missing_file_produces_no_risk(self):
        risks = _scan_content(os.path.join(self.tmpdir.name, "does-not-exist.txt"))
        self.assertEqual(risks, [])

    def test_scan_file_combines_name_and_content(self):
        fake_key = "sk_live_" + "abcdefghijklmnop"
        path = self._write(".env", f"API_KEY={fake_key}")
        risks = scan_file(path)
        risk_types = {r.risk_type for r in risks}
        self.assertIn("BLOCKED_FILE", risk_types)
        self.assertIn("SECRET_PATTERN", risk_types)


if __name__ == "__main__":
    unittest.main()
