import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths and repository details
const REPO_URL = 'https://github.com/LionWeb-io/lionweb-repository.git';
const COMMIT_HASH = '74d2c6ea6f719f27e6274182d5ab92c9b53cb3c6';
const CLONE_DIR = path.resolve(__dirname, 'repo-clone');
const MODULES = ['shared', 'client'];

/**
 * We may want to remove entries from package-lock as the version we are using could be slightly changed.
 */
function cleanUpRepoEntriesFromPackageLock() {
	const lockFilePath = path.resolve(__dirname, '..', 'package-lock.json');

	if (!fs.existsSync(lockFilePath)) {
		const lockFilePath = path.resolve(__dirname, '..', 'package-lock.json');
		console.log('Lock file path:', lockFilePath);
		console.warn('package-lock.json not found');
	}

	const raw = fs.readFileSync(lockFilePath, 'utf-8');
	const lock = JSON.parse(raw);

	// npm 7+ uses "packages", npm 6 and below uses "dependencies"
	const packagesToRemove = [
		'node_modules/@lionweb/repository-client',
		'node_modules/@lionweb/repository-shared'
	];

	if (lock.packages) {
		for (const pkg of packagesToRemove) {
			if (lock.packages[pkg]) {
				console.log(`Removing package entry: ${pkg}`);
				delete lock.packages[pkg];
			}
		}
	}

	// Also check top-level dependencies just in case
	if (lock.dependencies) {
		for (const pkg of packagesToRemove) {
			const depName = pkg.split('/').slice(-1)[0];
			if (lock.dependencies[depName]) {
				console.log(`Removing dependency entry: ${depName}`);
				delete lock.dependencies[depName];
			}
		}
	}

	// Write back to package-lock.json
	fs.writeFileSync(lockFilePath, JSON.stringify(lock, null, 2), 'utf-8');
	console.log('package-lock.json updated.');
}

try {
	cleanUpRepoEntriesFromPackageLock();

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
			execSync(`npm pack`, { cwd: modulePath, stdio: 'inherit' }); // Create a tarball
		} else {
			console.error(`Module ${module} not found in ${CLONE_DIR}`);
		}
	});

	// Link each module
	MODULES.forEach((module) => {
		const modulePath = path.join(CLONE_DIR, 'packages', module);
		if (fs.existsSync(modulePath)) {
			console.log(`Linking module locally: ${module}`);
			execSync(`npm install ${modulePath}/*.tgz`, { cwd: __dirname, stdio: 'inherit' }); // Install from local package
		} else {
			console.error(`Module ${module} not found in ${CLONE_DIR}`);
		}
	});

	console.log('Setup completed successfully!');
} catch (error) {
	console.error('Setup failed:', error);
	process.exit(1);
}
