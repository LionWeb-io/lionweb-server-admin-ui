<script lang="ts">
	import { onMount } from 'svelte';
	import type { SerializationChunk } from '@lionweb/core';
	import {
		listPartitionsIDs,
		createPartition,
		deletePartition,
		loadPartition,
		getRepositories
	} from '$lib/services/repository';
	import { page } from '$app/stores';
	import NodeTree from '$lib/components/NodeTree.svelte';
	import LanguageUI from '$lib/components/LanguageUI.svelte';
	import type { LionWebJsonChunk } from '@lionweb/repository-client';
	import type { RepositoryConfiguration } from '@lionweb/repository-shared';

	interface PartitionData {
		id: string;
		isLoaded?: boolean; 
		data?: SerializationChunk;
	}

	let repositoryName = $page.url.searchParams.get('repository') || 'default';
	let partitions: Array<PartitionData> = [];
	let loading = false;
	let error: string | null = null;
	let dragActive = false;
	let showDeleteConfirm = false;
	let partitionToDelete: PartitionData | null = null;
	let expandedNodes = new Set<string>();
	let repositories: Array<RepositoryConfiguration> = [];

	async function loadPartitions() {
		if (!repositoryName) return;

		loading = true;
		error = null;

		try {
			const partitionsIDs = await listPartitionsIDs(repositoryName);
			partitions = partitionsIDs.map((id) => ({ id:id, isLoaded: false }));
		} catch (e) {
			error = `Failed to load partitions: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		} finally {
			loading = false;
		}
	}

	async function handleCreatePartition(originalChunk: LionWebJsonChunk) {
		try {
			loading = true;
			error = null;

			await createPartition(repositoryName, originalChunk);
			await loadPartitions();

			// Show success message
			error = null;
		} catch (e) {
			console.error('Error in handleCreatePartition:jsonContent', e);
			error = `Failed to create partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
		} finally {
			loading = false;
		}
	}

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;

		const files = e.dataTransfer?.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		try {
			const content = await file.text();
			const jsonContent = JSON.parse(content);

			// Validate the basic structure
			if (!jsonContent.serializationFormatVersion || !Array.isArray(jsonContent.nodes)) {
				throw new Error('Invalid file format. Expected a LionWeb serialization chunk.');
			}

			handleCreatePartition(jsonContent);
		} catch (err) {
			error = `Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`;
		}
	}

	async function handleDeletePartition() {
		if (!partitionToDelete) return;

		try {
			loading = true;
			error = null;

			await deletePartition(repositoryName, partitionToDelete.id);

			// Reset state and close modal
			partitionToDelete = null;
			showDeleteConfirm = false;

			// Reload the list
			await loadPartitions();
		} catch (e) {
			error = `Failed to delete partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		} finally {
			loading = false;
		}
	}

	async function handleLoadPartition(partition: PartitionData) {
		try {
			loading = true;
			error = null;

			const data = await loadPartition(repositoryName, partition.id);

			// Update the partition with its data
			partitions = partitions.map((p) =>
				p.id === partition.id ? { ...p, isLoaded: true, data } : p
			);
		} catch (e) {
			error = `Failed to load partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		} finally {
			loading = false;
		}
	}

	function handleNodeClick(event: CustomEvent<{ nodeId: string }>) {
		const nodeId = event.detail.nodeId;
		// Find the partition containing this node
		const partition = partitions.find((p) => p.data?.nodes.some((n) => n.id === nodeId));
		if (partition) {
			// Ensure the partition is loaded
			if (!partition.isLoaded) {
				handleLoadPartition(partition);
			}
			// Expand all nodes in the path to this node
			if (partition.data) {
				let currentNode = partition.data.nodes.find((n) => n.id === nodeId);
				while (currentNode) {
					expandedNodes.add(currentNode.id);
					const parentId = currentNode.parent;
					currentNode = parentId ? partition.data.nodes.find((n) => n.id === parentId) : undefined;
				}
				expandedNodes = expandedNodes; // Trigger reactivity

				// Scroll to the node and highlight it
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
	}

	async function loadRepositories() {
		try {
			const response = await getRepositories();
			if (response.success) {
				repositories = response.repositories;
			} else {
				error = response.messages[0]?.message || 'Failed to load repositories';
			}
		} catch (e) {
			error = `Failed to load repositories: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		}
	}

	function handleRepositoryChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		const newRepo = select.value;

		// Update URL first
		const url = new URL(window.location.href);
		url.searchParams.set('repository', newRepo);
		window.history.pushState({}, '', url.toString());

		// Then update state and load data
		repositoryName = newRepo;
		loadPartitions();
	}

	async function handleSavePartition(partition: PartitionData) {
		try {
			// If partition is not loaded, load it first
			if (!partition.isLoaded) {
				await handleLoadPartition(partition);
			}

			// Now we know the partition is loaded, we can save it
			const partitionData = partitions.find((p) => p.id === partition.id)?.data;
			if (!partitionData) {
				throw new Error('Partition data not found');
			}

			// Create a Blob from the partition data
			const blob = new Blob([JSON.stringify(partitionData, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			// Create a temporary link and click it to trigger the download
			const link = document.createElement('a');
			link.href = url;
			link.download = `${partition.id}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Clean up the URL object
			URL.revokeObjectURL(url);
		} catch (e) {
			error = `Failed to save partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		}
	}

	onMount(async () => {
		await loadRepositories();
		await loadPartitions();
	});
</script>

<div class="relative min-h-screen">
	<!-- Background Logo -->
	<div class="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.02]">
		<img src="/images/lionweb-logo.png" alt="" class="h-[800px] w-[800px] object-contain" />
	</div>

	<div class="rounded-lg bg-white shadow">
		<div class="px-4 py-5 sm:p-6">
			<div class="flex items-center space-x-4">
				<label for="repository" class="block text-sm font-medium text-gray-700">
					Select Repository
				</label>
				<div class="relative w-96 rounded-lg border border-gray-200 bg-white p-2 shadow-md">
					<select
						id="repository"
						value={repositoryName}
						on:change={handleRepositoryChange}
						class="mt-1 block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-lg focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
					>
						{#each repositories as repo}
							<option value={repo.name}>
								{repo.name}
							</option>
						{/each}
					</select>
					{#if repositories.find((r) => r.name === repositoryName)}
						{@const selectedRepo = repositories.find((r) => r.name === repositoryName)}
						<div class="mt-2 flex flex-wrap gap-2">
							<span
								class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
							>
								LionWeb {selectedRepo?.lionweb_version}
							</span>
							{#if selectedRepo?.history}
								<span
									class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
								>
									History Enabled
								</span>
							{:else}
								<span
									class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
								>
									History Disabled
								</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
	<br />

	<!-- Content -->
	<div class="rounded-lg bg-white shadow">
		<div class="px-4 py-5 sm:p-6">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-900">Partitions in Repository {repositoryName}</h2>
			</div>

			{#if loading}
				<div class="py-12 text-center">
					<div
						class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
					></div>
				</div>
			{:else if error}
				<div class="py-12 text-center">
					<p class="text-red-600">{error}</p>
					<p class="mt-2 text-sm text-gray-500">
						Please check if the repository name is correct and the server is running at {import.meta
							.env.VITE_API_BASE_URL}
					</p>
				</div>
			{:else if partitions.length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">No partitions found in repository "{repositoryName}"</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each partitions as partition}
						<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
							<div class="px-6 py-4">
								<div class="flex items-start justify-between">
									<div class="flex items-center gap-3">
										<!-- Status dot -->
										<div class="flex-shrink-0">
											{#if partition.isLoaded}
												<div class="h-3 w-3 rounded-full bg-green-500"></div>
											{:else}
												<div class="h-3 w-3 rounded-full bg-gray-300"></div>
											{/if}
										</div>
										<!-- Partition info -->
										<div>
											<h3 class="text-lg font-semibold text-gray-900">{partition.id}</h3>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<!-- Load/Refresh button -->
										<button
											on:click={() => handleLoadPartition(partition)}
											class="inline-flex items-center rounded-full border border-transparent p-2 text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
											title={partition.isLoaded ? 'Refresh Partition' : 'Load Partition'}
										>
											{#if partition.isLoaded}
												<svg
													class="h-5 w-5"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fill-rule="evenodd"
														d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
														clip-rule="evenodd"
													/>
												</svg>
											{:else}
												<svg
													class="h-5 w-5"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fill-rule="evenodd"
														d="M4 16a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM10 4a1 1 0 00-1 1v6.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V5a1 1 0 00-1-1z"
														clip-rule="evenodd"
													/>
												</svg>
											{/if}
										</button>
										<!-- Save button -->
										<button
											on:click={() => handleSavePartition(partition)}
											class="inline-flex items-center rounded-full border border-transparent p-2 text-green-600 hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
											title="Save Partition"
										>
											<svg
												class="h-5 w-5"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
												/>
												<path
													stroke="white"
													stroke-width="1.5"
													stroke-linecap="round"
													d="M8 14l2 2 2-2"
												/>
											</svg>
										</button>
										<!-- Delete button -->
										<button
											on:click={() => {
												partitionToDelete = partition;
												showDeleteConfirm = true;
											}}
											class="inline-flex items-center rounded-full border border-transparent p-2 text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
											title="Delete Partition"
										>
											<svg
												class="h-5 w-5"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fill-rule="evenodd"
													d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
													clip-rule="evenodd"
												/>
											</svg>
										</button>
									</div>
								</div>

								<!-- Partition data -->
								{#if partition.isLoaded && partition.data}
									<div class="mt-4 border-t pt-4">
										<div class="space-y-4">
											<!-- Languages -->
											{#if partition.data.languages.length > 0}
												<div>
													<h4 class="mb-2 text-sm font-medium text-gray-700">Languages</h4>
													<div class="flex flex-wrap gap-2">
														{#each partition.data.languages as language}
															<LanguageUI language={language.key} version={language.version} />
														{/each}
													</div>
												</div>
											{/if}

											<!-- Nodes -->
											<div>
												<h4 class="mb-2 text-sm font-medium text-gray-700">Nodes</h4>
												<NodeTree
													chunk={partition.data}
													bind:expandedNodes
													on:nodeClick={handleNodeClick}
												/>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Add drag and drop area -->
			<div
				class="mt-6 rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 ease-in-out"
				class:border-indigo-600={dragActive}
				class:border-gray-300={!dragActive}
				class:bg-indigo-50={dragActive}
				on:dragenter={handleDragEnter}
				on:dragleave={handleDragLeave}
				on:dragover={handleDragOver}
				on:drop={handleDrop}
			>
				<div class="text-gray-600">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
						stroke="currentColor"
						fill="none"
						viewBox="0 0 48 48"
						aria-hidden="true"
					>
						<path
							d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<p class="mt-2">Drag and drop a LionWeb JSON file here to create a new partition</p>
					<p class="mt-1 text-sm text-gray-500">
						The file should contain a valid LionWeb serialization chunk
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div
		class="fixed inset-0 z-10 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0"
		>
			<div
				class="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity"
				aria-hidden="true"
			></div>
			<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true"
				>&#8203;</span
			>
			<div
				class="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
			>
				<div class="sm:flex sm:items-start">
					<div
						class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
					>
						<svg
							class="h-6 w-6 text-red-600"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>
					<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
						<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
							Delete Partition
						</h3>
						<div class="mt-2">
							<p class="text-sm text-gray-500">
								Are you sure you want to delete this partition? This action cannot be undone.
							</p>
						</div>
					</div>
				</div>
				<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						on:click={handleDeletePartition}
						class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
					>
						Delete
					</button>
					<button
						type="button"
						on:click={() => {
							partitionToDelete = null;
							showDeleteConfirm = false;
						}}
						class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
