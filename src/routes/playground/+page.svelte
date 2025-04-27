<script context="module" lang="ts">
	// Type declaration for window.loadPyodide
	interface WindowWithPyodide extends Window {
		loadPyodide?: any;
	}
	declare const window: WindowWithPyodide;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import MonacoEditor from '$lib/components/MonacoEditor.svelte';

	let pyodide: any = null;
	let code = `from lionwebpython.repoclient.repo_client import RepoClient
import matplotlib.pyplot as plt
import io
import base64
from js import document

# Step 1: Connect to Repo and gather data
rc = RepoClient()
repo_names = []
partition_counts = []

for repo in rc.list_repositories():
    rc_specific = RepoClient(repository_name=repo.name)
    partitions = rc_specific.list_partitions()
    repo_names.append(repo.name)
    partition_counts.append(len(partitions))
    print(f"Repo: {repo.name}, Partitions: {len(partitions)}")

# Step 2: Plot histogram
plt.figure(figsize=(10, 6))
plt.bar(repo_names, partition_counts, color='skyblue')
plt.xlabel('Repository')
plt.ylabel('Number of Partitions')
plt.title('Histogram of Partitions per Repository')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()

# Save plot to bytes buffer
buf = io.BytesIO()
plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
buf.seek(0)
image_base64 = base64.b64encode(buf.read()).decode('utf-8')
buf.close()
plt.close()  # Close the figure to free memory

# Display in HTML
output_div = document.getElementById('output')
img = document.createElement('img')
img.style.maxWidth = '100%'
img.style.height = 'auto'
img.src = f'data:image/png;base64,{image_base64}'
output_div.appendChild(img)`;
	let output = '';
	let loading = true;
	let error = '';
	let monacoLoaded = false;

	function loadPyodideScript(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (window.loadPyodide) {
				resolve();
				return;
			}
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load Pyodide script'));
			document.body.appendChild(script);
		});
	}

	onMount(async () => {
		loading = true;
		error = '';
		try {
			await loadPyodideScript();
			pyodide = await window.loadPyodide({ 
				indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
			});
			
			// Set up custom print function
			pyodide.runPython(`
				from js import document
				import sys
				import io
				class CustomIO(io.StringIO):
					def write(self, text):
						document.getElementById('output').textContent += text
					def flush(self):
						pass
				sys.stdout = CustomIO()
				sys.stderr = CustomIO()
			`);

			// Load required packages
			await pyodide.loadPackage(['matplotlib', 'numpy']);
			await pyodide.loadPackage('micropip');
			await pyodide.runPythonAsync(`
				import micropip
				await micropip.install("pydantic")
				await micropip.install("lionweb-python==0.1.16")
				await micropip.install("ipython")
			`);

			// Set up matplotlib to work in Pyodide
			pyodide.runPython(`
				import matplotlib
				matplotlib.use('Agg')  # Use Agg backend for non-interactive plotting
			`);

			monacoLoaded = true;
		} catch (e) {
			error = 'Failed to load Pyodide or required packages: ' + ((e instanceof Error) ? e.message : e);
		} finally {
			loading = false;
		}
	});

	async function runCode() {
		const outputElement = document.getElementById('output');
		if (outputElement) {
			outputElement.textContent = '';
		}
		try {
			await pyodide.runPythonAsync(code);
		} catch (e) {
			const errorMessage = (e instanceof Error) ? e.message : String(e);
			if (outputElement) {
				outputElement.textContent = errorMessage;
			}
		}
	}

	function handleCodeChange(newCode: string) {
		code = newCode;
	}
</script>

<div class="flex min-h-screen bg-white">
	<!-- Main Content Area -->
	<div class="flex-1 flex flex-col items-center justify-start py-8">
		<div class="w-full max-w-[95vw]">
			<div class="border-b border-gray-200 px-6 py-4">
				<h1 class="text-2xl font-semibold text-gray-900">Python Playground</h1>
				<p class="mt-1 text-sm text-gray-500">Interactive Python REPL powered by Pyodide and lionweb-python</p>
			</div>
			{#if loading}
				<div class="flex items-center justify-center h-64">
					<div class="text-center">
						<div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
						<p class="mt-4 text-sm text-gray-500">Loading Python environment and required packages...</p>
					</div>
				</div>
			{:else}
				{#if error}
					<div class="text-red-600 p-4">{error}</div>
				{/if}
				<div class="flex flex-row gap-4 p-4">
					<!-- Code Editor Section -->
					<div class="flex-1 flex flex-col">
						<div class="mb-2 flex justify-end">
							<button 
								class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
								on:click={runCode}
							>
								Run
							</button>
						</div>
						{#if monacoLoaded}
							<div class="flex-1">
								<MonacoEditor
									value={code}
									language="python"
									theme="vs-dark"
									height="calc(100vh - 200px)"
									onChange={handleCodeChange}
								/>
							</div>
						{:else}
							<textarea 
								class="w-full border rounded p-2 font-mono text-sm h-[calc(100vh-200px)]" 
								bind:value={code}
								placeholder="Loading Monaco editor..."
							></textarea>
						{/if}
					</div>

					<!-- Output Section -->
					<div class="flex-1 flex flex-col">
						<h2 class="text-sm font-semibold text-gray-700 mb-2">Output:</h2>
						<div class="flex-1">
							<pre id="output" class="output h-[calc(100vh-200px)]"></pre>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	:global(.monaco-editor) {
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		height: 100%;
	}

	.output {
		background-color: #f3f4f6;
		border-radius: 0.375rem;
		padding: 1rem;
		font-family: monospace;
		font-size: 0.875rem;
		white-space: pre;
		overflow-x: auto;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
	}
</style>
