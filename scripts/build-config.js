import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const configDir = path.resolve('./config');
const outputFile = path.resolve('./src/generated/compiled_config.json');

const compiled = {};

try {
  if (fs.existsSync(configDir)) {
    fs.readdirSync(configDir).forEach(file => {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const filePath = path.join(configDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const key = path.basename(file, path.extname(file));
        compiled[key] = yaml.load(content);
      }
    });

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(compiled, null, 2));
    console.log('Kaikki YAML-konfiguraatiot käännetty onnistuneesti tiedostoon:', outputFile);
  } else {
    console.log('Konfiguraatiokansiota ei löytynyt:', configDir);
  }
} catch (error) {
  console.error('Virhe konfiguraatioiden kääntämisessä:', error);
  process.exit(1);
}
