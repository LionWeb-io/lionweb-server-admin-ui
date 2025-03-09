<script lang="ts">
  import { onMount } from 'svelte';
  import type { SerializationChunk } from '@lionweb/core';

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
      console.log('Loading file:', file.name);
      const text = await file.text();
      console.log('File content:', text.substring(0, 500) + '...'); // Log first 500 chars
      chunk = JSON.parse(text) as SerializationChunk;
      console.log('Parsed chunk:', {
        version: chunk.serializationFormatVersion,
        languages: chunk.languages.length,
        nodes: chunk.nodes.length,
        firstNode: chunk.nodes[0] ? {
          id: chunk.nodes[0].id,
          classifier: chunk.nodes[0].classifier,
          properties: chunk.nodes[0].properties.length,
          containments: chunk.nodes[0].containments.length,
          references: chunk.nodes[0].references.length,
          parent: chunk.nodes[0].parent
        } : null
      });

      // Log all nodes to understand the structure
      console.log('All nodes:', chunk.nodes.map(n => ({
        id: n.id,
        parent: n.parent,
        classifier: n.classifier,
        properties: n.properties.length,
        containments: n.containments.length,
        references: n.references.length
      })));

      // Log root nodes
      const rootNodes = chunk.nodes.filter(node => !node.parent);
      console.log('Root nodes:', rootNodes.map(n => n.id));

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

  function toggleNode(nodeId: string) {
    if (expandedNodes.has(nodeId)) {
      expandedNodes.delete(nodeId);
    } else {
      expandedNodes.add(nodeId);
    }
    expandedNodes = expandedNodes; // Trigger reactivity
  }

  type NodeWithChildren = SerializationChunk['nodes'][0] & {
    level: number;
    children: NodeWithChildren[];
  };

  function getChildNodes(nodeId: string): SerializationChunk['nodes'] {
    if (!chunk?.nodes) return [];
    const children = chunk.nodes.filter(node => node.parent === nodeId);
    console.log(`Getting children for node ${nodeId}:`, children.map(n => n.id));
    return children;
  }

  function renderNodeTree(nodeId: string | null, level: number = 0): NodeWithChildren[] {
    if (!chunk?.nodes) return [];
    
    const nodes = nodeId === null 
      ? chunk.nodes.filter(node => !node.parent) // Root nodes
      : getChildNodes(nodeId);

    console.log(`Rendering nodes for parent ${nodeId || 'root'} at level ${level}:`, nodes.map(n => ({
      id: n.id,
      parent: n.parent,
      classifier: n.classifier,
      properties: n.properties?.length || 0,
      containments: n.containments?.length || 0,
      references: n.references?.length || 0
    })));

    return nodes.map(node => ({
      ...node,
      level,
      properties: node.properties || [],
      containments: node.containments || [],
      references: node.references || [],
      annotations: node.annotations || [],
      children: renderNodeTree(node.id, level + 1)
    }));
  }

  function hasChildren(node: SerializationChunk['nodes'][0]): boolean {
    if (!chunk?.nodes) return false;
    return chunk.nodes.some(n => n.parent === node.id);
  }

  function getRootNodeCount(): number {
    if (!chunk?.nodes) return 0;
    return chunk.nodes.filter(node => !node.parent).length;
  }

  function renderPropertyValue(property: { value: any }): string {
    if (property.value === null) return 'null';
    if (typeof property.value === 'object') return JSON.stringify(property.value);
    return String(property.value);
  }

  function renderContainmentValue(containment: { children: string[] }): string {
    return containment.children.join(', ');
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
    return reference?.values || [];
  }

  function getContainmentKey(containment: any): string {
    return containment?.containment?.key || 'Unknown';
  }

  function getContainmentLanguage(containment: any): string {
    return containment?.containment?.language || 'Unknown';
  }

  function getContainmentVersion(containment: any): string {
    return containment?.containment?.version || 'Unknown';
  }

  function getContainedNodes(containment: any): SerializationChunk['nodes'] {
    if (!chunk || !containment?.children) return [];
    return chunk.nodes.filter(node => containment.children.includes(node.id));
  }

  function debugProperty(property: any) {
    console.log('Property object:', property);
    console.log('Property details:', property.property);
    console.log('Value:', property.value);
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

  function debugReference(reference: any) {
    console.log('Reference object:', reference);
    console.log('Reference details:', reference.reference);
    console.log('Values:', reference.values);
  }

  function debugContainment(containment: any) {
    console.log('Containment object:', containment);
    console.log('Containment details:', containment.containment);
    console.log('Children:', containment.children);
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">LionWeb Playground</h1>
  
  <div
    bind:this={dropZone}
    class="border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 {isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}"
    on:dragenter={handleDragEnter}
    on:dragleave={handleDragLeave}
    on:dragover={handleDragOver}
    on:drop={handleDrop}
  >
    <div class="text-gray-600">
      <p class="text-lg mb-2">Drag and drop a LionWeb JSON file here</p>
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
        class="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
      >
        Select File
      </label>
    </div>
  </div>

  {#if error}
    <div class="mt-4 p-4 bg-red-100 text-red-700 rounded">
      {error}
    </div>
  {/if}

  {#if chunk}
    <div class="mt-8">
      <h2 class="text-xl font-semibold mb-4">File Contents - Serialization Format Version: {chunk.serializationFormatVersion}</h2>
      
      <div class="space-y-4">
        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-medium mb-2">Languages</h3>
          {#if !chunk?.languages?.length}
            <p class="italic text-gray-500">No languages specified</p>
          {:else}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each chunk.languages as language}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{language?.key || 'Unknown'}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{language?.version || 'Unknown'}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-medium mb-2">Nodes ({chunk?.nodes?.length || 0}, {getRootNodeCount()} roots)</h3>
          <div class="space-y-2">
            {#each renderNodeTree(null) as node}
              <div class="border rounded p-2" style="margin-left: {node.level * 20}px; background-color: {getNodeColor(node.id)}">
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
                                {getPropertyLanguage(property)} | {getPropertyVersion(property)} | {getPropertyKey(property)}
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
                        <p class="text-sm font-medium text-gray-700">References:</p>
                        <div class="overflow-x-auto">
                          <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                              <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Values</th>
                              </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                              {#each node.references as reference}
                                <tr>
                                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getReferenceLanguage(reference)}</td>
                                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getReferenceVersion(reference)}</td>
                                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getReferenceKey(reference)}</td>
                                  <td class="px-6 py-4 text-sm text-gray-900">{getReferenceValues(reference).length} values</td>
                                </tr>
                              {/each}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    {/if}
                    {#if node.containments.length > 0}
                      <div class="mt-2">
                        <p class="text-sm font-medium text-gray-700">Containments:</p>
                        {#each node.containments as containment}
                          <div class="mt-1">
                            <p class="text-sm text-gray-600">
                              {getContainmentKey(containment)} ({getContainmentLanguage(containment)} v{getContainmentVersion(containment)}):
                              {#if expandedNodes.has(node.id)}
                                <div class="mt-2 space-y-2">
                                  {#each getContainedNodes(containment) as childNode}
                                    <div class="border rounded p-2" style="margin-left: 20px; background-color: {getNodeColor(childNode.id)}">
                                      <div class="flex items-center space-x-2">
                                        {#if hasChildren(childNode)}
                                          <button
                                            class="text-gray-500 hover:text-gray-700"
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
                                            <div class="mt-1">
                                              <div class="properties-container">
                                                {#each childNode.properties as property}
                                                  <div class="property-row">
                                                    <span class="property-key bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                                      {getPropertyLanguage(property)} | {getPropertyVersion(property)} | {getPropertyKey(property)}
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
                                            <div class="mt-1">
                                              <p class="text-sm font-medium text-gray-700">References:</p>
                                              <div class="overflow-x-auto">
                                                <table class="min-w-full divide-y divide-gray-200">
                                                  <thead class="bg-gray-50">
                                                    <tr>
                                                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                                                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                                                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                                                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Values</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody class="bg-white divide-y divide-gray-200">
                                                    {#each childNode.references as reference}
                                                      <tr>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getReferenceLanguage(reference)}</td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getReferenceVersion(reference)}</td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getReferenceKey(reference)}</td>
                                                        <td class="px-6 py-4 text-sm text-gray-900">{getReferenceValues(reference).length} values</td>
                                                      </tr>
                                                    {/each}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          {/if}
                                        </div>
                                      </div>
                                    </div>
                                  {/each}
                                </div>
                              {:else}
                                <span class="text-gray-500">(children: {containment.children.length})</span>
                              {/if}
                            </p>
                          </div>
                        {/each}
                      </div>
                    {/if}
                    {#if node.annotations.length > 0}
                      <p class="text-sm text-gray-600">Annotations: {node.annotations.length}</p>
                    {/if}
                  </div>
                </div>
                {#if expandedNodes.has(node.id)}
                  {#each node.children as child}
                    <div class="mt-2">
                      {#each renderNodeTree(child.id, child.level) as grandChild}
                        <div class="border rounded p-2" style="margin-left: {grandChild.level * 20}px; background-color: {getNodeColor(grandChild.id)}">
                          <div class="flex items-center space-x-2">
                            {#if hasChildren(grandChild)}
                              <button
                                class="text-gray-500 hover:text-gray-700"
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
                                <div class="mt-1">
                                  <div class="properties-container">
                                    {#each grandChild.properties as property}
                                      <div class="property-row">
                                        <span class="property-key bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                          {getPropertyLanguage(property)} | {getPropertyVersion(property)} | {getPropertyKey(property)}
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
                              {#if grandChild.containments.length > 0}
                                <div class="mt-1">
                                  <p class="text-sm font-medium text-gray-700">Containments:</p>
                                  <ul class="list-disc list-inside text-sm text-gray-600">
                                    {#each grandChild.containments as containment}
                                      <li>{getContainmentKey(containment)}: {renderContainmentValue(containment)}</li>
                                    {/each}
                                  </ul>
                                </div>
                              {/if}
                              {#if grandChild.references.length > 0}
                                <p class="text-sm text-gray-600">References: {grandChild.references.length}</p>
                              {/if}
                              {#if grandChild.annotations.length > 0}
                                <p class="text-sm text-gray-600">Annotations: {grandChild.annotations.length}</p>
                              {/if}
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/each}
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
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
</style> 