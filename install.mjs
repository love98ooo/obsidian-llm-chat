import fs from 'fs';
import path from 'path';
import readline from 'readline';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read plugin ID from manifest.json
const manifestPath = path.join(__dirname, 'manifest.json');
let PLUGIN_ID = 'obsidian-llm-chat'; // Fallback
try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.id) PLUGIN_ID = manifest.id;
} catch (e) {
    console.warn('Could not read manifest.json, using default ID:', PLUGIN_ID);
}

const FILES_TO_LINK = ['main.js', 'manifest.json', 'styles.css'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};

async function findVaults() {
    const vaults = [];
    const HOME = process.env.HOME;
    if (!HOME) return vaults;

    const commonPaths = [
        path.join(HOME, 'Documents'),
        path.join(HOME, 'Library/Mobile Documents/iCloud~md~obsidian/Documents')
    ];

    for (const basePath of commonPaths) {
        if (fs.existsSync(basePath)) {
            try {
                const entries = fs.readdirSync(basePath, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const vaultPath = path.join(basePath, entry.name);
                        const obsidianConfigPath = path.join(vaultPath, '.obsidian');
                        if (fs.existsSync(obsidianConfigPath) && fs.statSync(obsidianConfigPath).isDirectory()) {
                            vaults.push(vaultPath);
                        }
                    }
                }
            } catch (err) {
                // Ignore errors (permission denied, etc.)
            }
        }
    }
    return vaults;
}

async function installPlugin(vaultPath) {
    const pluginsDir = path.join(vaultPath, '.obsidian', 'plugins');
    const targetDir = path.join(pluginsDir, PLUGIN_ID);

    if (!fs.existsSync(pluginsDir)) {
        console.error(`Error: Plugins directory not found at ${pluginsDir}`);
        return;
    }

    if (!fs.existsSync(targetDir)) {
        console.log(`Creating plugin directory: ${targetDir}`);
        fs.mkdirSync(targetDir, { recursive: true });
    }

    for (const file of FILES_TO_LINK) {
        const srcPath = path.join(__dirname, file);
        const destPath = path.join(targetDir, file);

        if (!fs.existsSync(srcPath)) {
            if (file === 'styles.css') continue; // Optional
            console.warn(`Warning: Source file ${file} not found.`);
            continue;
        }

        if (fs.existsSync(destPath)) {
            // Check if it's already linked or exists
            const stats = fs.lstatSync(destPath);
             if (stats.isSymbolicLink()) { // Check symlink first
                 fs.unlinkSync(destPath);
                 console.log(`Removed existing symlink for ${file}`);
             } else {
                 // For hard links, we can't easily distinguish from a copy without checking inode,
                 // but we can just overwrite or ask.
                 // To be safe and simple, we'll unlink and re-link.
                 fs.unlinkSync(destPath);
                 console.log(`Removed existing file ${file}`);
             }
        }

        try {
            // User requested hard link
            fs.linkSync(srcPath, destPath);
            console.log(`Hard linked ${file} -> ${destPath}`);
        } catch (err) {
            console.error(`Failed to hard link ${file}: ${err.message}`);
            console.log('Attempting symlink instead...');
            try {
                fs.symlinkSync(srcPath, destPath);
                console.log(`Symlinked ${file} -> ${destPath}`);
            } catch (symErr) {
                 console.error(`Failed to symlink ${file}: ${symErr.message}`);
            }
        }
    }
    console.log(`\nPlugin installed successfully to ${vaultPath}`);
}

async function main() {
    console.log('Obsidian Plugin Installer (CLI)');
    console.log('-------------------------------');

    let targetVaultPath = process.argv[2];

    if (!targetVaultPath) {
        console.log('Scanning for Obsidian vaults...');
        const vaults = await findVaults();

        if (vaults.length > 0) {
            console.log('\nFound the following vaults:');
            vaults.forEach((v, i) => console.log(`${i + 1}. ${v}`));
            console.log(`${vaults.length + 1}. Enter path manually`);

            const answer = await askQuestion('\nSelect a vault (number): ');
            const index = parseInt(answer) - 1;

            if (index >= 0 && index < vaults.length) {
                targetVaultPath = vaults[index];
            }
        } else {
            console.log('No vaults found automatically.');
        }
    }

    if (!targetVaultPath) {
        targetVaultPath = await askQuestion('Enter the absolute path to your Obsidian vault: ');
    }

    // Remove quotes if user added them
    targetVaultPath = targetVaultPath.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();

    if (!fs.existsSync(targetVaultPath)) {
        console.error('Invalid path provided.');
        rl.close();
        process.exit(1);
    }

    await installPlugin(targetVaultPath);
    rl.close();
}

main();
