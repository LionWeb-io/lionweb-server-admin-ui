<!-- NodeTree.svelte -->
<script lang="ts">
  import type { SerializationChunk } from '@lionweb/core';
  import { createEventDispatcher } from 'svelte';

  export let chunk: SerializationChunk;
  export let expandedNodes: Set<string> = new Set();

  const dispatch = createEventDispatcher();

  function toggleNode(nodeId: string) {
    if (expandedNodes.has(nodeId)) {
      expandedNodes.delete(nodeId);
    } else {
      expandedNodes.add(nodeId);
    }
    expandedNodes = expandedNodes; // Trigger reactivity
  }

  function getChildNodes(nodeId: string): SerializationChunk['nodes'] {
    if (!chunk?.nodes) return [];
    const children = chunk.nodes.filter(node => node.parent === nodeId);
    return children;
  }

  function hasChildren(node: SerializationChunk['nodes'][0]): boolean {
    if (!chunk?.nodes || !node.containments) return false;
    return node.containments.some(containment => getContainedNodes(containment).length > 0);
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

  function getReferenceKey(reference: any): string {
    return reference?.reference?.key || 'Unknown';
  }

  function getReferenceLanguage(reference: any): string {
    return reference?.reference?.language || 'Unknown';
  }

  function getReferenceVersion(reference: any): string {
    return reference?.reference?.version || 'Unknown';
  }

  function getReferenceValues(reference: any): any[] {
    return reference?.values || reference?.targets || [];
  }

  function renderPropertyValue(property: { value: any }): string {
    if (property.value === null) return 'null';
    if (typeof property.value === 'object') return JSON.stringify(property.value);
    return String(property.value);
  }

  function getContainedNodes(containment: any): SerializationChunk['nodes'] {
    if (!chunk || !containment?.children) return [];
    return chunk.nodes.filter(node => containment.children.includes(node.id));
  }

  function getNodeColor(nodeId: string): string {
    // Generate a consistent hash from the node ID
    let hash = 0;
    for (let i = 0; i < nodeId.length; i++) {
      hash = nodeId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to HSL color with high lightness for pastel colors
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 95%)`;
  }

  function renderNodeTree(nodeId: string | null, level: number = 0): any[] {
    if (!chunk?.nodes) return [];
    
    // Get root nodes or child nodes depending on nodeId
    const nodes = nodeId === null 
      ? chunk.nodes.filter(node => !node.parent) // Root nodes
      : chunk.nodes.filter(node => node.parent === nodeId); // Child nodes

    return nodes.map(node => {
      return {
        ...node,
        level,
        properties: node.properties || [],
        containments: node.containments || [],
        references: node.references || [],
        annotations: node.annotations || []
      };
    });
  }

  function handleNodeClick(nodeId: string) {
    dispatch('nodeClick', { nodeId });
  }
</script>

<div class="space-y-2">
  {#each renderNodeTree(null) as node}
    <div class="border rounded p-2" style="margin-left: {node.level * 20}px; background-color: {getNodeColor(node.id)}" id="node-{node.id}">
      <div class="flex items-start space-x-2">
        {#if hasChildren(node)}
          <button
            class="text-gray-500 hover:text-gray-700 mt-1"
            on:click={() => toggleNode(node.id)}
          >
            {expandedNodes.has(node.id) ? '▼' : '▶'}
          </button>
        {:else}
          <span class="w-4"></span>
        {/if}
        <div>
          <p class="font-medium">ID: {node.id || 'Unknown'}</p>
          {#if node.classifier}
            <p class="text-sm text-gray-600">Classifier: {node.classifier?.key || 'Unknown'} v{node.classifier?.version || 'Unknown'}</p>
          {/if}
          {#if node.properties?.length}
            <div class="mt-2">
              <div class="properties-container">
                {#each node.properties as property}
                  <div class="property-row">
                    <span class="property-key bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                      (<i>{getPropertyLanguage(property)}</i>|<i>{getPropertyVersion(property)}</i>) {getPropertyKey(property)}
                    </span>
                    <span class="property-equals">=</span>
                    <span class="property-value bg-blue-50 text-gray-700 px-2 py-0.5 rounded border border-blue-100 shadow-sm">
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
                {#each node.references as reference}
                  {#if getReferenceValues(reference).length > 0}
                    <div class="property-row">
                      <span class="property-key bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                        (<i>{getReferenceLanguage(reference)}</i>|<i>{getReferenceVersion(reference)}</i>) {getReferenceKey(reference)}
                      </span>
                      <span class="reference-arrow">→</span>
                      <div class="reference-targets">
                        {#each getReferenceValues(reference) as target}
                          <span class="reference-target">
                            {#if target.resolveInfo}
                              <span>{target.resolveInfo}</span>
                            {/if}
                            {#if target.reference}
                              <span class="reference-link" on:click={() => handleNodeClick(target.reference)}>
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
          {#if node.containments.length > 0 && expandedNodes.has(node.id)}
            <div class="mt-2">
              {#each node.containments as containment}
                {#each getContainedNodes(containment) as childNode}
                  <div class="border rounded p-2" style="margin-left: 20px; background-color: {getNodeColor(childNode.id)}" id="node-{childNode.id}">
                    <div class="flex items-start space-x-2">
                      {#if hasChildren(childNode)}
                        <button
                          class="text-gray-500 hover:text-gray-700 mt-1"
                          on:click={() => toggleNode(childNode.id)}
                        >
                          {expandedNodes.has(childNode.id) ? '▼' : '▶'}
                        </button>
                      {:else}
                        <span class="w-4"></span>
                      {/if}
                      <div>
                        <p class="font-medium">ID: {childNode.id}</p>
                        {#if childNode.classifier}
                          <p class="text-sm text-gray-600">Classifier: {childNode.classifier.key} v{childNode.classifier.version}</p>
                        {/if}
                        {#if childNode.properties.length > 0}
                          <div class="mt-2">
                            <div class="properties-container">
                              {#each childNode.properties as property}
                                <div class="property-row">
                                  <span class="property-key bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                    (<i>{getPropertyLanguage(property)}</i>|<i>{getPropertyVersion(property)}</i>) {getPropertyKey(property)}
                                  </span>
                                  <span class="property-equals">=</span>
                                  <span class="property-value bg-blue-50 text-gray-700 px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                                    {renderPropertyValue({ value: getPropertyValue(property) })}
                                  </span>
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}
                        {#if childNode.references.length > 0}
                          <div class="mt-2">
                            <div class="properties-container">
                              {#each childNode.references as reference}
                                {#if getReferenceValues(reference).length > 0}
                                  <div class="property-row">
                                    <span class="property-key bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                      (<i>{getReferenceLanguage(reference)}</i>|<i>{getReferenceVersion(reference)}</i>) {getReferenceKey(reference)}
                                    </span>
                                    <span class="reference-arrow">→</span>
                                    <div class="reference-targets">
                                      {#each getReferenceValues(reference) as target}
                                        <span class="reference-target">
                                          {#if target.resolveInfo}
                                            <span>{target.resolveInfo}</span>
                                          {/if}
                                          {#if target.reference}
                                            <span class="reference-link" on:click={() => handleNodeClick(target.reference)}>
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
                        {#if childNode.containments.length > 0 && expandedNodes.has(childNode.id)}
                          <div class="mt-2">
                            {#each childNode.containments as containment}
                              {#each getContainedNodes(containment) as grandChild}
                                <div class="border rounded p-2" style="margin-left: 20px; background-color: {getNodeColor(grandChild.id)}" id="node-{grandChild.id}">
                                  <div class="flex items-start space-x-2">
                                    {#if hasChildren(grandChild)}
                                      <button
                                        class="text-gray-500 hover:text-gray-700 mt-1"
                                        on:click={() => toggleNode(grandChild.id)}
                                      >
                                        {expandedNodes.has(grandChild.id) ? '▼' : '▶'}
                                      </button>
                                    {:else}
                                      <span class="w-4"></span>
                                    {/if}
                                    <div>
                                      <p class="font-medium">ID: {grandChild.id}</p>
                                      {#if grandChild.classifier}
                                        <p class="text-sm text-gray-600">Classifier: {grandChild.classifier.key} v{grandChild.classifier.version}</p>
                                      {/if}
                                      {#if grandChild.properties.length > 0}
                                        <div class="mt-2">
                                          <div class="properties-container">
                                            {#each grandChild.properties as property}
                                              <div class="property-row">
                                                <span class="property-key bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                                  (<i>{getPropertyLanguage(property)}</i>|<i>{getPropertyVersion(property)}</i>) {getPropertyKey(property)}
                                                </span>
                                                <span class="property-equals">=</span>
                                                <span class="property-value bg-blue-50 text-gray-700 px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                                                  {renderPropertyValue({ value: getPropertyValue(property) })}
                                                </span>
                                              </div>
                                            {/each}
                                          </div>
                                        </div>
                                      {/if}
                                      {#if grandChild.references.length > 0}
                                        <div class="mt-2">
                                          <div class="properties-container">
                                            {#each grandChild.references as reference}
                                              {#if getReferenceValues(reference).length > 0}
                                                <div class="property-row">
                                                  <span class="property-key bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                                    (<i>{getReferenceLanguage(reference)}</i>|<i>{getReferenceVersion(reference)}</i>) {getReferenceKey(reference)}
                                                  </span>
                                                  <span class="reference-arrow">→</span>
                                                  <div class="reference-targets">
                                                    {#each getReferenceValues(reference) as target}
                                                      <span class="reference-target">
                                                        {#if target.resolveInfo}
                                                          <span>{target.resolveInfo}</span>
                                                        {/if}
                                                        {#if target.reference}
                                                          <span class="reference-link" on:click={() => handleNodeClick(target.reference)}>
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
                              {/each}
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              {/each}
            </div>
          {/if}
        </div>
      </div>
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
    0% { background-color: #fef3c7; }
    100% { background-color: inherit; }
  }
</style> 