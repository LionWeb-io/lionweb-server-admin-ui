<!-- NodeTree.svelte -->
<script lang="ts">
	import type {
		SerializationChunk,
		SerializedNode,
		SerializedContainment,
		MetaPointer
	} from '@lionweb/core';
	import { createEventDispatcher } from 'svelte';
	import MetaPointerUI from '$lib/components/MetaPointerUI.svelte';
	import RootTag from '$lib/components/RootTag.svelte';

	export let chunk: SerializationChunk;
	export let expandedNodes: Set<string> = new Set();
	export let level: number = 0;
	export let nodeId: string | null = null;
	let allContainments = chunk.nodes
		.map((container: SerializedNode) => container.containments)
		.flat();

	const dispatch = createEventDispatcher();

	function getRole(nodeId: string): MetaPointer | undefined {
		return allContainments.find((containment: SerializedContainment) =>
			containment.children.includes(nodeId)
		)?.containment;
	}

	let allRoles = new Map<string, MetaPointer | undefined>();
	chunk.nodes.forEach((node: SerializedNode) => {
		allRoles.set(node.id, getRole(node.id));
	});

	function toggleNode(id: string) {
		if (expandedNodes.has(id)) {
			expandedNodes.delete(id);
		} else {
			expandedNodes.add(id);
		}
		expandedNodes = expandedNodes; // Trigger reactivity
	}

	function getChildNodes(id: string): SerializationChunk['nodes'] {
		if (!chunk?.nodes) return [];
		const children = chunk.nodes.filter((node) => node.parent === id);
		return children;
	}

	function hasChildren(node: SerializationChunk['nodes'][0]): boolean {
		return getChildNodes(node.id).length > 0;
	}

	function getPropertyKey(property: any): string {
		return property?.property?.key || 'Unknown';
	}

	function getPropertyLanguage(property: any): string {
		return property?.property?.language || 'Unknown';
	}

	function getPropertyVersion(property: any): string {
		return property?.property?.version || 'Unknown';
	}

	function getPropertyValue(property: any): any {
		return property?.value;
	}

	function getReferenceValues(reference: any): any[] {
		return reference?.values || reference?.targets || [];
	}

	function renderPropertyValue(property: { value: any }): string {
		if (property.value === null) return 'null';
		if (typeof property.value === 'object') return JSON.stringify(property.value);
		return String(property.value);
	}

	function getNodeColor(id: string): string {
		// Generate a consistent hash from the node ID
		let hash = 0;
		for (let i = 0; i < id.length; i++) {
			hash = id.charCodeAt(i) + ((hash << 5) - hash);
		}

		// Convert hash to HSL color with high lightness for pastel colors
		const hue = Math.abs(hash % 360);
		return `hsl(${hue}, 70%, 95%)`;
	}

	function handleNodeClick(id: string) {
		dispatch('nodeClick', { nodeId: id });
	}

	function isFirstNodeInContainment(node: SerializedNode): boolean {
		const role = allRoles.get(node.id);
		if (!role) return false;

		// Get all nodes with the same containment
		const nodesInSameContainment = chunk.nodes.filter(
			(n) =>
				allRoles.get(n.id)?.key === role.key &&
				allRoles.get(n.id)?.language === role.language &&
				allRoles.get(n.id)?.version === role.version &&
				n.parent === node.parent
		);

		// Return true if this is the first node
		return nodesInSameContainment[0]?.id === node.id;
	}

	$: nodes =
		nodeId === null
			? chunk?.nodes?.filter((node) => !node.parent) || [] // Root nodes
			: getChildNodes(nodeId);
</script>

<div class="space-y-2">
	{#each nodes as node: SerializedNode}
		<div
			class="/*border*/ rounded p-2"
			style="margin-left: {level * 20}px; /*background-color: {getNodeColor(node.id)}*/"
			id="node-{node.id}"
		>
			<div class="flex flex-col space-y-2">
				{#if allRoles.get(node.id) != null && isFirstNodeInContainment(node)}
					<div class="containment-role">
						<MetaPointerUI
							language={allRoles.get(node.id)?.language || 'Unknown'}
							key={allRoles.get(node.id)?.key || 'Unknown'}
							version={allRoles.get(node.id)?.version || 'Unknown'}
						/>
					</div>
				{/if}
				<div class="flex items-start space-x-2">
					{#if hasChildren(node)}
						<button
							class="mt-1 text-gray-500 hover:text-gray-700"
							on:click={() => toggleNode(node.id)}
						>
							{expandedNodes.has(node.id) ? '▼' : '▶'}
						</button>
					{:else}
						<span class="w-4"></span>
					{/if}
					<div class="flex-grow rounded border p-2" style="background-color: white">
						<div class="node-header">
							<p class="font-medium">{node.id || 'Unknown'}</p>
							<div class="classifier">
								<MetaPointerUI
									language={node.classifier?.language}
									key={node.classifier?.key}
									version={node.classifier?.version}
								/>
							</div>
						</div>

						{#if node.properties?.length || node.references?.length}
							<hr class="my-2 border-t border-gray-200" />
						{/if}

						{#if node.properties?.length}
							<div class="mt-2">
								<div class="properties-container">
									{#each node.properties as property}
										<div class="property-row">
											<MetaPointerUI
												language={property.property.language}
												key={property.property.key}
												version={property.property.version}
											/>
											<span class="property-equals">=</span>
											<span
												class="property-value rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-gray-700 shadow-sm"
											>
												{renderPropertyValue({ value: getPropertyValue(property) })}
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						{#if node.references.length > 0}
							<div class="mt-2">
								<div class="properties-container">
									{#each node.references as reference: SerializedReference}
										{#if getReferenceValues(reference).length > 0}
											<div class="property-row">
												<MetaPointerUI
													language={reference.reference.language}
													key={reference.reference.key}
													version={reference.reference.version}
												/>
												<span class="reference-arrow">→</span>
												<div class="reference-targets">
													{#each getReferenceValues(reference) as target}
														<span class="reference-target">
															{#if target.resolveInfo}
																<span>{target.resolveInfo}</span>
															{/if}
															{#if target.reference}
																<span
																	class="reference-link"
																	on:click={() => handleNodeClick(target.reference)}
																>
																	({target.reference})
																</span>
															{/if}
														</span>
													{/each}
												</div>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
			{#if expandedNodes.has(node.id)}
				<svelte:self {chunk} {expandedNodes} nodeId={node.id} level={level + 1} on:nodeClick />
			{/if}
		</div>
	{/each}
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

	.node-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.node-header p {
		margin: 0;
	}

	.classifier {
		flex-shrink: 0;
	}

	.containment-role {
		margin-left: 1.5rem;
		margin-bottom: 0.5rem;
	}
</style>
