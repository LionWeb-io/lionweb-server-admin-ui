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
	import NodeDetails from '$lib/components/NodeDetails.svelte';
	import type { LionWebJsonNode } from '@lionweb/validation/src/json/LionWebJson';
	import type { LionWebJsonChunk } from '@lionweb/validation';
	import { currentNodeName } from '$lib/stores/currentNodeName';
	import { onMount, onDestroy, afterUpdate } from 'svelte';

	export let chunk: LionWebJsonChunk;
	export let expandedNodes: Set<string> = new Set();
	export let level: number = 0;
	export let nodeId: string | null = null;
	export let visibleNodeId: string | null = null;
	let localVisibleNodeId: string | null = null;
	let observer: IntersectionObserver;
	let visibleEntries: Record<string, { ratio: number; level: number }> = {};
	export let nodeRefs: Record<string, { el: HTMLElement, level: number }> | undefined;

	if (level === 0 && !nodeRefs) {
		nodeRefs = {};
	}

	if (level === 0) {
		observer = new IntersectionObserver(updateMostVisibleNode, {
			root: null,
			rootMargin: '0px',
			threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
		});
	}

	let allContainments = chunk.nodes
		.map((container: LionWebJsonNode) => container.containments)
		.flat();
	let allAnnotationIds = new Set(chunk.nodes
		.map((container: LionWebJsonNode) => container.annotations)
		.flat());

	const dispatch = createEventDispatcher();

	let nodeElements: Record<string, HTMLElement> = {};

	function getRole(nodeId: string): MetaPointer | undefined {
		return allContainments.find((containment: SerializedContainment) =>
			containment.children.includes(nodeId)
		)?.containment;
	}

	let allRoles = new Map<string, MetaPointer | undefined>();
	chunk.nodes.forEach((node: LionWebJsonNode) => {
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

	function getChildNodes(id: string): LionWebJsonNode[] {
		if (!chunk?.nodes) return [];
		const children = chunk.nodes.filter((node) => node.parent === id);
		return children;
	}

	function getAnnotationsOn(id: string): string[] {
		if (!chunk?.nodes) return [];
		const thisNode = chunk.nodes.find((node) => node.id === id)!!;
		return thisNode.annotations;
	}

	function hasChildren(node: LionWebJsonNode): boolean {
		return getChildNodes(node.id).length > 0;
	}

	function hasAnnotations(node: LionWebJsonNode): boolean {
		return getAnnotationsOn(node.id).length > 0;
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

	function isFirstNodeInContainment(node: LionWebJsonNode): boolean {
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

	function isAnnotation(node: LionWebJsonNode): boolean {
		return allAnnotationIds.has(node.id);
	}

	function isFirstAnnotation(node: LionWebJsonNode): boolean {
		if (!allAnnotationIds.has(node.id)) {
			return false;
		}

		// Get all nodes with the same containment
		const siblingAnnotations = chunk.nodes.find(
			(n) =>
				n.id == node.parent
		)?.annotations;

		return siblingAnnotations?.at(0) === node.id;
	}

	function getNodeName(node: LionWebJsonNode): string {
		const nameProp = node.properties?.find(
			(p) => p.property.key === 'LionCore-builtins-INamed-name'
		);
		return nameProp?.value ?? node.id;
	}

	function updateMostVisibleNode(entries: IntersectionObserverEntry[]) {
		for (const entry of entries) {
			const nodeId = entry.target.getAttribute('data-node-id');
			const nodeLevel = Number(entry.target.getAttribute('data-level'));
			if (!nodeId) continue;
			if (entry.isIntersecting) {
				visibleEntries[nodeId] = { ratio: entry.intersectionRatio, level: nodeLevel };
			} else {
				delete visibleEntries[nodeId];
			}
		}
		// Find the deepest node (highest level), tiebreaker: highest intersection ratio
		let mostVisibleId: string | null = null;
		let maxLevel = -1;
		let maxRatio = 0;
		for (const [id, { ratio, level }] of Object.entries(visibleEntries)) {
			if (level > maxLevel || (level === maxLevel && ratio > maxRatio)) {
				maxLevel = level;
				maxRatio = ratio;
				mostVisibleId = id;
			}
		}
		if (mostVisibleId !== localVisibleNodeId) {
			localVisibleNodeId = mostVisibleId;
			if (mostVisibleId) {
				const node = chunk.nodes.find((n) => n.id === mostVisibleId);
				if (node) {
					currentNodeName.set(getNodeName(node));
				}
			}
		}
		if (!mostVisibleId) {
			localVisibleNodeId = null;
		}
	}

	function registerNodeRefAction(el: HTMLElement, params: { nodeId: string, level: number }) {
		console.log('registerNodeRefAction called', el, params);
		if (el && params && nodeRefs) {
			nodeRefs[params.nodeId] = { el, level: params.level };
			return {
				destroy() {
					delete nodeRefs[params.nodeId];
				}
			};
		}
	}

	function updateActiveNodeByScroll() {
		console.log('Scroll handler called');
		const viewportCenter = window.innerHeight / 2;
		let minDist = Infinity;
		let maxLevel = -1;
		let activeId: string | null = null;
		console.log('nodeRefs:', nodeRefs);
		for (const [id, { el, level }] of Object.entries(nodeRefs ?? {})) {
			const rect = el.getBoundingClientRect();
			console.log('Checking node', id, 'level', level, 'rect', rect);
			if (rect.top <= window.innerHeight && rect.bottom >= 0) { // visible
				const nodeCenter = (rect.top + rect.bottom) / 2;
				const dist = Math.abs(nodeCenter - viewportCenter);
				if (
					level > maxLevel ||
					(level === maxLevel && dist < minDist)
				) {
					maxLevel = level;
					minDist = dist;
					activeId = id;
				}
			}
		}
		console.log('Selected activeId:', activeId);
		if (activeId !== localVisibleNodeId) {
			localVisibleNodeId = activeId;
			if (activeId) {
				const node = chunk.nodes.find((n) => n.id === activeId);
				if (node) {
					currentNodeName.set(getNodeName(node));
				}
			}
		}
		if (!activeId) {
			localVisibleNodeId = null;
		}
	}

	function onScrollOrResize() {
		updateActiveNodeByScroll();
	}

	onMount(() => {
		if (level === 0) {
			window.addEventListener('scroll', onScrollOrResize, { passive: true });
			window.addEventListener('resize', onScrollOrResize, { passive: true });
			// Initial update after DOM is ready
			setTimeout(updateActiveNodeByScroll, 100);
		}
	});

	afterUpdate(() => {
		if (level === 0) {
			setTimeout(updateActiveNodeByScroll, 0);
		}
	});

	onDestroy(() => {
		if (level === 0) {
			window.removeEventListener('scroll', onScrollOrResize);
			window.removeEventListener('resize', onScrollOrResize);
		}
	});

	$: effectiveVisibleNodeId = level === 0 ? localVisibleNodeId : visibleNodeId;

	$: nodes =
		nodeId === null
			? chunk?.nodes?.filter((node) => !node.parent) || [] // Root nodes
			: getChildNodes(nodeId);

	function highlightClass(nodeId: string) {
		// Always return the highlight class for debugging
		return 'ring-4 ring-indigo-400 shadow-lg shadow-indigo-300 bg-yellow-200';
	}
</script>

<div class="space-y-2">
	{#each nodes as node:LionWebJsonNode}
		<div class="rounded p-2">
			<div class="flex flex-col space-y-2">
				{#if allRoles.get(node.id) != null && isFirstNodeInContainment(node)}
					<div class="containment-role">
						<MetaPointerUI
							language={allRoles.get(node.id)?.language || 'Unknown'}
							key={allRoles.get(node.id)?.key || 'Unknown'}
							version={allRoles.get(node.id)?.version || 'Unknown'}
						/>
					</div>
				{:else if isFirstAnnotation(node)}
					<div class="text-sm font-semibold uppercase text-gray-500 border-b border-gray-200 pb-1 mb-2">
						Annotations
					</div>
				{/if}
				<div class="flex items-start space-x-2">
					{#if hasChildren(node) || hasAnnotations(node)}
						<button
							class="mt-1 text-gray-500 hover:text-gray-700"
							on:click={() => toggleNode(node.id)}
						>
							{expandedNodes.has(node.id) ? '▼' : '▶'}
						</button>
					{:else}
						<span class="w-4"></span>
					{/if}
					{#if isAnnotation(node)}
						<div
							class={`flex-grow rounded border-l-4 border-yellow-400 bg-yellow-100 bg-opacity-20 p-2 max-w-2xl shadow-sm rounded-r ${highlightClass(node.id)}`}
						>
							<span style="font-size:10px; color:blue;">
								node.id: {node.id} | effectiveVisibleNodeId: {effectiveVisibleNodeId}
							</span>
							{#if effectiveVisibleNodeId === node.id}
								<span style="color: red; font-weight: bold;">ACTIVE</span>
							{/if}
							<div class="flex items-center justify-between mb-1">
								<p class="font-medium text-yellow-800 text-sm break-all min-w-0">
									📝 {node.id || 'Unknown'}
								</p>
								<div class="classifier flex-shrink-0">
									<MetaPointerUI
										language={node.classifier?.language}
										key={node.classifier?.key}
										version={node.classifier?.version}
									/>
								</div>
							</div>
							<NodeDetails {node} {handleNodeClick} />
						</div>
					{:else}
						<div
							class={`flex-grow rounded border p-2 max-w-2xl ${highlightClass(node.id)}`}
							style="background-color: white"
						>
							<span style="font-size:10px; color:blue;">
								node.id: {node.id} | effectiveVisibleNodeId: {effectiveVisibleNodeId}
							</span>
							{#if effectiveVisibleNodeId === node.id}
								<span style="color: red; font-weight: bold;">ACTIVE</span>
							{/if}
							<div class="node-header">
								<p class="font-medium break-all min-w-0">🔹 {node.id || 'Unknown'}</p>
								<div class="classifier flex-shrink-0">
									<MetaPointerUI
										language={node.classifier?.language}
										key={node.classifier?.key}
										version={node.classifier?.version}
									/>
								</div>
							</div>
							<NodeDetails {node} {handleNodeClick} />
						</div>
					{/if}
				</div>
			</div>
			{#if expandedNodes.has(node.id)}
				<svelte:self {chunk} {expandedNodes} nodeId={node.id} level={level + 1} visibleNodeId={effectiveVisibleNodeId} nodeRefs={nodeRefs} on:nodeClick />
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
		white-space: pre-wrap;
		font-family: monospace;
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

<!-- Force Tailwind to include highlight classes -->
<div class="hidden ring-4 ring-indigo-400 ring-red-500 shadow-lg shadow-indigo-300"></div>
