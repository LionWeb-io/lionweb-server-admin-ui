<!-- NodeTree.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ChevronRight, ChevronDown } from 'svelte-heros';
	import type { LionWebJsonNode, LionWebJsonProperty } from '@lionweb/validation';
	import type { LionWebJsonChunk } from '@lionweb/repository-client';
	import { getPropertyValue } from '$lib/utils/noderendering';

	export let chunk: LionWebJsonChunk;
	export let expandedNodes: Set<string> = new Set();
	export let parentId: string | null = null;
	export let depth = 0;

	const dispatch = createEventDispatcher<{
		nodeClick: { nodeId: string };
	}>();

	$: nodes = chunk.nodes.filter((node) => node.parent === parentId);

	function getChildNodes(node: LionWebJsonNode): LionWebJsonNode[] {
		return chunk.nodes.filter((n) => n.parent === node.id);
	}

	function handleNodeClick(nodeId: string) {
		dispatch('nodeClick', { nodeId });
	}

	function toggleNode(nodeId: string) {
		if (expandedNodes.has(nodeId)) {
			expandedNodes.delete(nodeId);
		} else {
			expandedNodes.add(nodeId);
		}
		expandedNodes = expandedNodes; // trigger reactivity
	}

	function getNodeLabel(node: LionWebJsonNode): string {
		const nameProperty = node.properties.find((p: LionWebJsonProperty) => p.property.id === 'name');
		return nameProperty ? getPropertyValue(nameProperty) || 'unnamed' : 'unnamed';
	}

	function getNodeDescription(node: LionWebJsonNode): string {
		const descriptionProperty = node.properties.find((p: LionWebJsonProperty) => p.property.id === 'description');
		return descriptionProperty ? getPropertyValue(descriptionProperty) || '' : '';
	}
</script>

{#each nodes as node (node.id)}
	<div class="node-container" style="margin-left: {depth * 1.5}rem" id="node-{node.id}">
		<div
			class="flex items-center py-2 px-1 hover:bg-gray-100 rounded cursor-pointer"
			on:click={() => handleNodeClick(node.id)}
		>
			{#if getChildNodes(node).length > 0}
				<button
					class="p-1 hover:bg-gray-200 rounded-full mr-1"
					on:click|stopPropagation={() => toggleNode(node.id)}
				>
					{#if expandedNodes.has(node.id)}
						<ChevronDown class="h-4 w-4 text-gray-500" />
					{:else}
						<ChevronRight class="h-4 w-4 text-gray-500" />
					{/if}
				</button>
			{:else}
				<div class="w-6" />
			{/if}

			<div class="flex items-center gap-2">
				<span class="text-sm font-medium text-gray-900">{getNodeLabel(node)}</span>
				<span class="text-xs text-gray-500">{node.classifier}</span>
			</div>
		</div>

		{#if expandedNodes.has(node.id)}
			<svelte:self
				{chunk}
				bind:expandedNodes
				parentId={node.id}
				depth={depth + 1}
				on:nodeClick
			/>
		{/if}
	</div>
{/each}

<style>
	.node-container {
		transition: margin-left 0.2s ease-in-out;
	}
</style>
