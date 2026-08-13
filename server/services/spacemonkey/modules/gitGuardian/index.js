import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const router = express.Router();

// --- 1. SECURITY SCANNER LOGIC ---
const BLOCKED_FILES = [
  /\.env.*/i,
  /.*\.pem$/i,
  /.*\.key$/i,
  /id_rsa.*/i,
  /credentials\.json$/i
];

const SECRET_PATTERNS = [
  /(?:API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE_KEY)\s*=\s*['"][^'"]+['"]/i,
  /ghp_[a-zA-Z0-9]{36}/,
  /sk_live_[0-9a-zA-Z]{24}/,
  /-----BEGIN PRIVATE KEY-----/
];

async function scanFiles(files, rootDir = process.cwd()) {
  const risks = [];

  for (const file of files) {
    const fileName = path.basename(file);

    // Tarkista estetyt tiedostomuodot / nimitavat
    for (const pattern of BLOCKED_FILES) {
      if (pattern.test(fileName)) {
        risks.push({
          file,
          type: 'BLOCKED_FILE',
          reason: `Kielletty tiedostonimi/muoto: ${pattern}`
        });
      }
    }

    // Tarkista tiedoston sisältö salaisuuksien varalta
    try {
      const fullPath = path.join(rootDir, file);
      const content = await fs.readFile(fullPath, 'utf-8');

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          risks.push({
            file,
            type: 'SECRET_DETECTED',
            reason: `Kielletty salaisuuskaava havaittu koodissa: ${pattern}`
          });
          break;
        }
      }
    } catch (err) {
      // Tiedosto saattaa olla poistettu, ohitetaan sisällön luku
    }
  }

  return {
    safe: risks.length === 0,
    risks
  };
}

// --- 2. GUARDIAN ENGINE LOGIC ---
async function getGitStatus(rootDir = process.cwd()) {
  try {
    // Hae nykyinen branch
    const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir });
    const branch = branchOut.trim();

    // Hae muutokset (porcelain-formaatissa)
    const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: rootDir });
    const lines = statusOut.split('\n').filter(Boolean);
    const changedFiles = lines.map(line => line.slice(3).trim());

    // Aja turvallisuusskannaus
    const security = await scanFiles(changedFiles, rootDir);

    return {
      online: true,
      status: 'ONLINE',
      mode: 'SAFE',
      repository: 'Wood-Booster-HQ',
      branch,
      changesCount: changedFiles.length,
      changedFiles,
      isDirty: changedFiles.length > 0,
      security
    };
  } catch (error) {
    return {
      online: false,
      error: error.message
    };
  }
}

// --- 3. API ROUTES ---

// GET /api/gitguardian/status
router.get('/status', async (req, res) => {
  const status = await getGitStatus();
  res.json(status);
});

// POST /api/gitguardian/backup
router.post('/backup', async (req, res) => {
  const currentStatus = await getGitStatus();

  if (!currentStatus.online) {
    return res.status(500).json({ success: false, message: 'Git Guardian offline tai vireessä on virhe.' });
  }

  if (!currentStatus.security.safe) {
    return res.status(400).json({
      success: false,
      message: '🛑 Varmuuskopiointi ESTETTY: Turvallisuusriski havaittu!',
      risks: currentStatus.security.risks
    });
  }

  if (!currentStatus.isDirty) {
    return res.json({
      success: true,
      message: 'Ei uusia muutoksia varmuuskopioitavaksi.'
    });
  }

  // Tässä ajetaan turvallinen commit kun toteutetaan Sprint 4
  res.json({
    success: true,
    message: '✅ Turvatarkistus läpäisty! Valmis varmuuskopiointiin.',
    changesCount: currentStatus.changesCount,
    files: currentStatus.changedFiles
  });
});

export default router;
