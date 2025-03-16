<script lang="ts">
	import type { SerializationChunk } from '@lionweb/core';
	import NodeTree from '$lib/components/NodeTree.svelte';
	import LanguageUI from '$lib/components/LanguageUI.svelte';

	let dropZone: HTMLElement;
	let isDragging = false;
	let chunk: SerializationChunk | null = null;
	let error: string | null = null;
	let expandedNodes = new Set<string>();

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	async function handleFileLoad(file: File) {
		try {
			const text = await file.text();
			chunk = JSON.parse(text) as SerializationChunk;
			error = null;
		} catch (e) {
			console.error('Error loading file:', e);
			error = `Failed to parse file: ${e instanceof Error ? e.message : 'Unknown error'}`;
			chunk = null;
		}
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;

		const files = e.dataTransfer?.files;
		if (!files || files.length === 0) return;

		await handleFileLoad(files[0]);
	}

	function handleNodeClick(event: CustomEvent<{ nodeId: string }>) {
		const nodeId = event.detail.nodeId;
		if (chunk) {
			// Expand all nodes in the path to this node
			let currentNode = chunk.nodes.find((n) => n.id === nodeId);
			while (currentNode) {
				expandedNodes.add(currentNode.id);
				const parentId = currentNode.parent;
				currentNode = parentId ? chunk.nodes.find((n) => n.id === parentId) : undefined;
			}
			expandedNodes = expandedNodes; // Trigger reactivity

			// Scroll to the node
			setTimeout(() => {
				const element = document.getElementById(`node-${nodeId}`);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'center' });
					// Add a temporary highlight
					element.classList.add('highlight-node');
					setTimeout(() => element.classList.remove('highlight-node'), 2000);
				}
			}, 100);
		}
	}
</script>

<div class="relative min-h-screen">
	<!-- Background Logo -->
	<div class="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.02]">
		<img src="/images/lionweb-logo.png" alt="" class="h-[800px] w-[800px] object-contain" />
	</div>

	<!-- Content -->
	<div class="container mx-auto p-4">
		<h1 class="mb-4 text-2xl font-bold">Files Inspector</h1>

		<div
			bind:this={dropZone}
			class="rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 {isDragging
				? 'border-blue-500 bg-blue-50'
				: 'border-gray-300'}"
			on:dragenter={handleDragEnter}
			on:dragleave={handleDragLeave}
			on:dragover={handleDragOver}
			on:drop={handleDrop}
		>
			<div class="text-gray-600">
				<p class="mb-2 text-lg">Drag and drop a LionWeb JSON file here</p>
				<p class="text-sm">or</p>
				<input
					type="file"
					accept=".json"
					class="hidden"
					id="fileInput"
					on:change={async (e: Event) => {
						const target = e.target as HTMLInputElement;
						const files = target.files;
						if (files && files.length > 0) {
							await handleFileLoad(files[0]);
						}
					}}
				/>
				<label
					for="fileInput"
					class="mt-2 inline-block cursor-pointer rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
				>
					Select File
				</label>
			</div>
		</div>

		{#if error}
			<div class="mt-4 rounded bg-red-100 p-4 text-red-700">
				{error}
			</div>
		{/if}

		{#if chunk}
			<div class="mt-8">
				<h2 class="mb-4 text-xl font-semibold">
					File Contents - Serialization Format Version: {chunk.serializationFormatVersion}
				</h2>

				<div class="space-y-4">
					<div class="rounded bg-white p-4 shadow">
						<h3 class="mb-2 font-medium">Languages</h3>
						{#if !chunk?.languages?.length}
							<p class="text-gray-500 italic">No languages specified</p>
						{:else}
							<div>
								<h4 class="mb-2 text-sm font-medium text-gray-700">Languages</h4>
								<div class="flex flex-wrap gap-2">
									{#each chunk.languages as language}
										<LanguageUI language={language.key} version={language.version} />
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<div class="rounded bg-white p-4 shadow">
						<h3 class="mb-2 font-medium">Nodes ({chunk?.nodes?.length || 0} total)</h3>
						<NodeTree {chunk} bind:expandedNodes on:nodeClick={handleNodeClick} />
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.properties-container {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.property-row {
		display: flex;
		align-items: center;
	}
	.property-key {
		width: fit-content;
	}
	.property-equals {
		width: 30px;
		text-align: center;
		flex: 0 0 auto;
	}
	.property-value {
		width: fit-content;
	}
	.reference-arrow {
		width: 30px;
		text-align: center;
		flex: 0 0 auto;
		color: #666;
	}
	.reference-targets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.reference-target {
		background-color: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 0.25rem;
		padding: 0.125rem 0.5rem;
		font-size: 0.875rem;
		color: #0369a1;
	}
	.reference-link {
		cursor: pointer;
		text-decoration: underline;
		color: #0284c7;
	}
	.reference-link:hover {
		color: #0369a1;
	}
	.highlight-node {
		animation: highlight 2s ease-out;
	}

	@keyframes highlight {
		0% {
			background-color: #fef3c7;
		}
		100% {
			background-color: inherit;
		}
	}
</style>
