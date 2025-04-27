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
	let code = 'import lionweb\nprint(lionweb.__version__)';
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
				indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
				stdout: (text: string) => {
					output += text;
				},
				stderr: (text: string) => {
					output += text;
				}
			});
			await pyodide.loadPackage('micropip');
			await pyodide.runPythonAsync(`import micropip\nawait micropip.install(\"pydantic\")\nawait micropip.install(\"lionweb-python==0.1.16\")`);
			monacoLoaded = true;
		} catch (e) {
			error = 'Failed to load Pyodide or lionweb-python: ' + ((e instanceof Error) ? e.message : e);
		} finally {
			loading = false;
		}
	});

	async function runCode() {
		output = '';
		try {
			let result = await pyodide.runPythonAsync(code);
			if (result !== undefined) {
				output += result.toString();
			}
		} catch (e) {
			output = (e instanceof Error) ? e.message : String(e);
		}
	}

	function handleCodeChange(newCode: string) {
		code = newCode;
	}
</script>

<div class="flex min-h-screen bg-white">
	<!-- Main Content Area -->
	<div class="flex-1 flex flex-col items-center justify-start py-8">
		<div class="w-full max-w-4xl">
			<div class="border-b border-gray-200 px-6 py-4">
				<h1 class="text-2xl font-semibold text-gray-900">Python Playground</h1>
				<p class="mt-1 text-sm text-gray-500">Interactive Python REPL powered by Pyodide and lionweb-python</p>
			</div>
			{#if loading}
				<div class="flex items-center justify-center h-64">
					<div class="text-center">
						<div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
						<p class="mt-4 text-sm text-gray-500">Loading Python environment and lionweb-python...</p>
					</div>
				</div>
			{:else}
				{#if error}
					<div class="text-red-600 p-4">{error}</div>
				{/if}
				<div class="p-4">
					{#if monacoLoaded}
						<div class="mb-4">
							<MonacoEditor
								value={code}
								language="python"
								theme="vs-dark"
								height="60vh"
								onChange={handleCodeChange}
							/>
						</div>
					{:else}
						<textarea 
							class="w-full border rounded p-2 font-mono text-sm" 
							rows="8" 
							bind:value={code}
							placeholder="Loading Monaco editor..."
						></textarea>
					{/if}
					<div class="mt-2 flex justify-end">
						<button 
							class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
							on:click={runCode}
						>
							Run
						</button>
					</div>
					<div class="mt-4">
						<h2 class="text-sm font-semibold text-gray-700 mb-1">Output:</h2>
						<pre class="bg-gray-100 rounded p-2 min-h-[2em] text-sm overflow-x-auto whitespace-pre-wrap">{output}</pre>
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
	}
</style> 