<!-- NodeNavigation.svelte -->
<script lang="ts">
	import { writable } from 'svelte/store';
	import type { LionWebJsonChunk, LionWebJsonNode } from '@lionweb/validation';
	import NodeOutline from './NodeOutline.svelte';

	export let chunk: LionWebJsonChunk;
	export let selectedNodeId: string | null = null;
	export let onNodeSelect: (nodeId: string) => void;
	export let expandedNodes: Set<string>;

	const activeTab = writable<'outline' | 'byType'>('outline');

	// Group nodes by language and type
	$: nodesByType = chunk.nodes.reduce((acc, node) => {
		const language = node.classifier?.language || 'Unknown';
		const type = node.classifier?.key || 'Unknown';

		if (!acc[language]) {
			acc[language] = {};
		}
		if (!acc[language][type]) {
			acc[language][type] = [];
		}
		acc[language][type].push(node);
		return acc;
	}, {} as Record<string, Record<string, LionWebJsonNode[]>>);

	function handleNodeClick(nodeId: string) {
		onNodeSelect(nodeId);
	}
</script>

<div class="flex flex-col h-full">
	<div class="flex border-b bg-white sticky top-0 z-10">
		<button
			class="px-4 py-2 font-medium {$activeTab === 'outline' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
			on:click={() => $activeTab = 'outline'}
		>
			Outline
		</button>
		<button
			class="px-4 py-2 font-medium {$activeTab === 'byType' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
			on:click={() => $activeTab = 'byType'}
		>
			By Type
		</button>
	</div>

	<div class="flex-1 overflow-y-auto bg-white">
		{#if $activeTab === 'outline'}
			<NodeOutline
				{chunk}
				{expandedNodes}
				{selectedNodeId}
				on:nodeClick={({ detail }) => {
					console.log("select from outline", detail.nodeId);
					handleNodeClick(detail.nodeId)
				}}
			/>
		{:else}
			<div class="p-4 space-y-4">
				{#each Object.entries(nodesByType).sort(([langA], [langB]) => langA.localeCompare(langB)) as [language, types]}
				<div class="space-y-2">
						<h3 class="font-semibold text-lg">{language}</h3>
					{#each Object.entries(types).sort(([typeA], [typeB]) => typeA.localeCompare(typeB)) as [type, nodes]}
					<div class="ml-4 space-y-1">
								<h4 class="font-medium text-sm text-gray-600" style="text-decoration: underline">{type}</h4>
								{#each nodes as node}
									<button
										class="w-full text-left px-2 py-1 rounded hover:bg-gray-100 {selectedNodeId === node.id ? 'bg-blue-50 border border-blue-200' : ''}"
										on:click={() => {
											console.log("select from by type", node.id);
											handleNodeClick(node.id);
										}}
									>
										{node.id}
									</button>
								{/each}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.highlight-node) {
		animation: highlight 2s ease-out;
	}

	@keyframes highlight {
		0% {
			background-color: rgba(59, 130, 246, 0.5);
		}
		100% {
			background-color: transparent;
		}
	}
</style>
