import type { Partition, PartitionListResponse } from '$lib/types';
import type { LionwebResponse, RepositoryConfiguration, LionWebVersionType, ListRepositoriesResponse } from '@lionweb/repository-shared';
import { RepositoryClient } from '@lionweb/repository-client';
import type {
	LionWebJsonChunk
} from '@lionweb/repository-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
const CLIENT_ID = 'lionWebRepoAdminUI';

async function handleResponse(response: Response) {
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`API Error (${response.status}): ${errorText}`);
	}
	return response.json();
}

export async function getRepositories(): Promise<ListRepositoriesResponse> {
	const client = new RepositoryClient(CLIENT_ID, null);
	const response = await client.dbAdmin.listRepositories();
	if (response.body.success) {
		return response.body;
	} else {
		console.error('Error fetching repositories:', response.body.messages);
		throw new Error(`Failed to fetch repositories: ${response.body.messages}`);
	}
}

export async function createRepository(
	repositoryConfiguration: RepositoryConfiguration
): Promise<void> {
	const client = new RepositoryClient(CLIENT_ID, null);
	const response = await client.dbAdmin.createRepository(
		repositoryConfiguration.name,
		repositoryConfiguration.history,
		repositoryConfiguration.lionweb_version as LionWebVersionType
	);
	if (response.body.success) {
		return;
	} else {
		console.error('Error creating repositories:', response.body.messages);
		throw new Error(`Failed to create repositories: ${response.body.messages}`);
	}
}

export async function deleteRepository(repositoryName: string): Promise<void> {
	const client = new RepositoryClient(CLIENT_ID, null);
	const response = await client.dbAdmin.deleteRepository(repositoryName);
	if (response.body.success) {
		return;
	} else {
		console.error('Error delete repositories:', response.body.messages);
		throw new Error(`Failed to delete repositories: ${response.body.messages}`);
	}
}

export async function getPartitions(repositoryName: string): Promise<PartitionListResponse> {
	try {
		const params = new URLSearchParams({
			clientId: CLIENT_ID,
			repository: repositoryName
		});

		const response = await fetch(`${API_BASE_URL}/bulk/listPartitions?${params.toString()}`, {
			method: 'POST',
			headers: {
				Accept: 'application/json'
			}
		});
		const data = await handleResponse(response);

		// Extract partition IDs from the nested structure
		const partitionIds = data?.chunk?.nodes?.map((node: { id: string }) => node.id) || [];

		// Convert the response to our expected format
		const partitions = partitionIds.map((id: string) => ({
			id,
			name: id // Using ID as name since we don't have the actual name
		}));

		return {
			partitions,
			total: partitionIds.length
		};
	} catch (e) {
		console.error('Error fetching partitions:', e);
		throw new Error(
			`Failed to fetch partitions: ${e instanceof Error ? e.message : 'Unknown error'}`
		);
	}
}

export async function createPartition(
	repositoryName: string,
	chunk: LionWebJsonChunk
): Promise<Partition> {
	const client = new RepositoryClient(CLIENT_ID, repositoryName);

	console.log('Creating partition with data:', {
		repositoryName,
		chunk: JSON.stringify(chunk, null, 2)
	});

	const rootNodes = chunk.nodes.filter((node) => node.parent === null);
	if (rootNodes.length !== 1) {
		throw new Error('Expected exactly one root node, got ' + rootNodes.length);
	}

	const emptyContainments = rootNodes[0].containments.map((containment) => {
		return { containment: containment.containment, children: [] };
	});

	const rootifiedNode = {
		id: rootNodes[0].id,
		classifier: rootNodes[0].classifier,
		properties: rootNodes[0].properties,
		containments: emptyContainments,
		references: rootNodes[0].references,
		annotations: [],
		parent: null
	};

	const tmpChunk: LionWebJsonChunk = {
		serializationFormatVersion: chunk.serializationFormatVersion,
		languages: chunk.languages,
		nodes: [rootifiedNode]
	};

	const response = await client.bulk.createPartitions(tmpChunk);

	const responseData = response.body as LionwebResponse;
	console.log('Create partition response:', responseData);

	if (!responseData.success) {
		throw new Error(JSON.stringify(responseData.messages || 'Failed to create partition'));
	}

	// Extract the partition ID from the response messages
	const versionMessage = responseData.messages?.find(
		(msg) => msg.kind === 'RepoVersion'
	);
	if (!versionMessage) {
		throw new Error('No version information found in response');
	}

	// Create a partition object with the available information
	const partition: Partition = {
		id: rootifiedNode.id
	};

	const storeResponse = await client.bulk.store(chunk);
	if (!storeResponse.body.success) {
		throw new Error(JSON.stringify(storeResponse.body.messages || 'Failed to store the partition data'));
	}

	return partition;
}

export async function deletePartition(repositoryName: string, partitionId: string): Promise<void> {
	const client = new RepositoryClient(CLIENT_ID, repositoryName);
	const response = await client.bulk.deletePartitions([partitionId]);

	if (!response.body.success) {
		throw new Error(JSON.stringify(response.body.messages || 'Failed to delete partition'));
	}
}

export async function loadPartition(
	repositoryName: string,
	partitionId: string
): Promise<LionWebJsonChunk> {
	const client = new RepositoryClient(CLIENT_ID, repositoryName);
	const response = await client.bulk.retrieve([partitionId]);

	if (!response.body.success) {
		throw new Error(JSON.stringify(response.body.messages || 'Failed to load partition'));
	}

	console.log('Load partition response:', response.body);

	return response.body.chunk;
}
