import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths and repository details
const REPO_URL = 'https://github.com/LionWeb-io/lionweb-repository.git';
const COMMIT_HASH = '6fec1602c00cdd8bdfaf710f746e3f918c9a0b8d';
const CLONE_DIR = path.resolve(__dirname, 'repo-clone');
const MODULES = ['shared', 'client'];

try {
	if (!fs.existsSync(CLONE_DIR)) {
		console.log('Initializing repository...');
		execSync(`git init ${CLONE_DIR}`, { stdio: 'inherit' });

		console.log('Adding remote origin...');
		execSync(`git remote add origin ${REPO_URL}`, { cwd: CLONE_DIR, stdio: 'inherit' });

		console.log(`Fetching only commit ${COMMIT_HASH}...`);
		execSync(`git fetch --depth 1 origin ${COMMIT_HASH}`, { cwd: CLONE_DIR, stdio: 'inherit' });

		console.log(`Checking out commit ${COMMIT_HASH}...`);
		execSync(`git checkout FETCH_HEAD`, { cwd: CLONE_DIR, stdio: 'inherit' });

		execSync('npm install && npm run build', { cwd: CLONE_DIR, stdio: 'inherit' });
	} else {
		console.log('Repository already exists, skipping initialization...');
	}

	// Build each module
	MODULES.forEach((module) => {
		const modulePath = path.join(CLONE_DIR, 'packages', module);
		if (fs.existsSync(modulePath)) {
			console.log(`Building module: ${module}`);
			execSync('npm run build', { cwd: modulePath, stdio: 'inherit' });
	
			console.log(`Packing module: ${module}`);
			const tarballName = execSync('npm pack', { cwd: modulePath }).toString().trim();
			const tarballPath = path.join(modulePath, tarballName);
	
			if (fs.existsSync(tarballPath)) {
				console.log(`Installing module from: ${tarballPath}`);
				execSync(`npm install ${tarballPath}`, { cwd: __dirname, stdio: 'inherit' });
			} else {
				console.error(`Tarball ${tarballPath} was not created`);
				process.exit(1);
			}
		} else {
			console.error(`Module ${module} not found in ${CLONE_DIR}`);
		}
	});

	console.log('Setup completed successfully!');
} catch (error) {
	console.error('Setup failed:', error);
	process.exit(1);
}
