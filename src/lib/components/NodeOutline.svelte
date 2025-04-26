<!-- NodeOutline.svelte -->
<script lang="ts">
	import type { LionWebJsonChunk, LionWebJsonNode } from '@lionweb/validation';
	import { createEventDispatcher } from 'svelte';

	export let chunk: LionWebJsonChunk;
	export let expandedNodes: Set<string> = new Set();
	export let selectedNodeId: string | null = null;
	export let level: number = 0;
	export let nodeId: string | null = null;

	const dispatch = createEventDispatcher();

	function getNodeName(node: LionWebJsonNode): { text: string; isId: boolean } {
		const nameProperty = node.properties.find(p => p.property.key === 'LionCore-builtins-INamed-name');
		return {
			text: nameProperty?.value || node.id,
			isId: !nameProperty
		};
	}

	function getChildNodes(id: string): LionWebJsonNode[] {
		if (!chunk?.nodes) return [];
		return chunk.nodes.filter((node) => node.parent === id);
	}

	function hasChildren(node: LionWebJsonNode): boolean {
		return getChildNodes(node.id).length > 0;
	}

	function toggleNode(id: string) {
		if (expandedNodes.has(id)) {
			expandedNodes.delete(id);
		} else {
			expandedNodes.add(id);
		}
		expandedNodes = expandedNodes; // Trigger reactivity
	}

	function handleNodeClick(id: string) {
		dispatch('nodeClick', { nodeId: id });
	}

	$: nodes =
		nodeId === null
			? chunk?.nodes?.filter((node) => !node.parent) || [] // Root nodes
			: getChildNodes(nodeId);
</script>

<div class="space-y-1">
	{#each nodes as node:LionWebJsonNode}
		{@const nodeInfo = getNodeName(node)}
		<div
			class="rounded {selectedNodeId === node.id ? 'highlight-node' : ''}"
			style="margin-left: {level * 20}px;"
			id="node-{node.id}"
		>
			<div class="flex items-center space-x-1">
				{#if hasChildren(node)}
					<button
						class="text-gray-500 hover:text-gray-700"
						on:click={() => toggleNode(node.id)}
					>
						{expandedNodes.has(node.id) ? '▼' : '▶'}
					</button>
				{:else}
					<span class="w-4"></span>
				{/if}
				<button
					class="flex-grow text-left px-2 py-1 rounded hover:bg-gray-100 {selectedNodeId === node.id ? 'bg-blue-50 border border-blue-200' : ''} {nodeInfo.isId ? 'font-mono text-sm text-gray-600' : 'font-medium text-gray-900'}"
					on:click={() => handleNodeClick(node.id)}
				>
					{nodeInfo.text}
				</button>
			</div>
			{#if expandedNodes.has(node.id)}
				<svelte:self
					{chunk}
					{expandedNodes}
					nodeId={node.id}
					level={level + 1}
					{selectedNodeId}
					on:nodeClick
				/>
			{/if}
		</div>
	{/each}
</div>

<style>
	.highlight-node {
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