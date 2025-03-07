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

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      const text = await file.text();
      chunk = JSON.parse(text) as SerializationChunk;
      error = null;
    } catch (e) {
      error = `Failed to parse file: ${e instanceof Error ? e.message : 'Unknown error'}`;
      chunk = null;
    }
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
    if (!chunk) return [];
    return chunk.nodes.filter(node => node.parent === nodeId);
  }

  function renderNodeTree(nodeId: string | null, level: number = 0): NodeWithChildren[] {
    if (!chunk) return [];
    
    const nodes = nodeId === null 
      ? chunk.nodes.filter(node => !node.parent) // Root nodes
      : getChildNodes(nodeId);

    return nodes.map(node => ({
      ...node,
      level,
      children: renderNodeTree(node.id, level + 1)
    }));
  }

  function hasChildren(node: SerializationChunk['nodes'][0]): boolean {
    if (!chunk) return false;
    return chunk.nodes.some(n => n.parent === node.id);
  }

  function getRootNodeCount(): number {
    if (!chunk) return 0;
    return chunk.nodes.filter(node => !node.parent).length;
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
        on:change={(e: Event) => {
          const target = e.target as HTMLInputElement;
          const files = target.files;
          if (files && files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                chunk = JSON.parse(event.target?.result as string) as SerializationChunk;
                error = null;
              } catch (e) {
                error = `Failed to parse file: ${e instanceof Error ? e.message : 'Unknown error'}`;
                chunk = null;
              }
            };
            reader.readAsText(file);
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
      <h2 class="text-xl font-semibold mb-4">File Contents</h2>
      
      <div class="space-y-4">
        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-medium mb-2">Serialization Format Version</h3>
          <p class="text-gray-700">{chunk.serializationFormatVersion}</p>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-medium mb-2">Languages</h3>
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{language.key}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{language.version}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-medium mb-2">Nodes ({chunk.nodes.length}, {getRootNodeCount()} roots)</h3>
          <div class="space-y-2">
            {#each renderNodeTree(null) as node}
              <div class="border rounded p-2" style="margin-left: {node.level * 20}px">
                <div class="flex items-center space-x-2">
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
                  <div>
                    <p class="font-medium">ID: {node.id}</p>
                    {#if node.classifier}
                      <p class="text-sm text-gray-600">Classifier: {node.classifier.key} v{node.classifier.version}</p>
                    {/if}
                    {#if node.properties.length > 0}
                      <p class="text-sm text-gray-600">Properties: {node.properties.length}</p>
                    {/if}
                    {#if node.containments.length > 0}
                      <p class="text-sm text-gray-600">Containments: {node.containments.length}</p>
                    {/if}
                    {#if node.references.length > 0}
                      <p class="text-sm text-gray-600">References: {node.references.length}</p>
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
                        <div class="border rounded p-2" style="margin-left: {grandChild.level * 20}px">
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
                                <p class="text-sm text-gray-600">Properties: {grandChild.properties.length}</p>
                              {/if}
                              {#if grandChild.containments.length > 0}
                                <p class="text-sm text-gray-600">Containments: {grandChild.containments.length}</p>
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
  /* Add any additional styles here */
</style> 