import type { Partition } from '$lib/types';
import type {
	LionwebResponse,
	RepositoryConfiguration,
	LionWebVersionType,
	ListRepositoriesResponse
} from '@lionweb/server-shared';
import { RepositoryClient } from '@lionweb/server-client';
import type { LionWebJsonChunk } from '@lionweb/server-client';
import type { LionWebJsonNode } from '@lionweb/validation';
import { getNodeName } from '$lib/utils/noderendering';

const CLIENT_ID = 'lionWebRepoAdminUI';

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

export async function listPartitionsIDs(repositoryName: string): Promise<string[]> {
	const client = new RepositoryClient(CLIENT_ID, repositoryName);
	const response = await client.bulk.listPartitions()
	if (response.body.success) {
		return response.body.chunk.nodes.map(node => node.id);
	} else {
		console.error('Error listPartitions:', response.body.messages);
		throw new Error(`Failed to listPartitions: ${response.body.messages}`);
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
	const versionMessage = responseData.messages?.find((msg) => msg.kind === 'RepoVersion');
	if (!versionMessage) {
		throw new Error('No version information found in response');
	}

	// Create a partition object with the available information
	const partition: Partition = {
		id: rootifiedNode.id
	};

	const storeResponse = await client.bulk.store(chunk);
	if (!storeResponse.body.success) {
		throw new Error(
			JSON.stringify(storeResponse.body.messages || 'Failed to store the partition data')
		);
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

export async function loadPartitionNames(
	repositoryName: string,
	partitionIds: string[]
): Promise<Map<string, string | undefined>> {
	const client = new RepositoryClient(CLIENT_ID, repositoryName);
	const response = await client.bulk.retrieve(partitionIds, 0);

	if (!response.body.success) {
		throw new Error(JSON.stringify(response.body.messages || 'Failed to load partition shallow data'));
	}

	const partitionNames = new Map<string, string | undefined>();
	response.body.chunk.nodes.forEach((node) => {
		const name = getNodeName(node);
		partitionNames.set(node.id, name);
	});
	return partitionNames;
}

export async function loadShallowPartitions(
	repositoryName: string,
	partitionIds: string[]
): Promise<Map<string, LionWebJsonNode>> {
	const client = new RepositoryClient(CLIENT_ID, repositoryName);
	const response = await client.bulk.retrieve(partitionIds, 0);

	if (!response.body.success) {
		throw new Error(JSON.stringify(response.body.messages || 'Failed to load partition shallow data'));
	}

	const partitionData = new Map<string, LionWebJsonNode>();
	response.body.chunk.nodes.forEach((node) => {
		partitionData.set(node.id, node);
	});
	return partitionData;
}

export async function downloadRepositoryAsZip(repositoryName: string,
	progressCallback: (current: number, total: number) => void): Promise<Blob> {

	// Get list of all partitions
	const existingPartitionsIDs = await listPartitionsIDs(repositoryName);
	const totalPartitions = existingPartitionsIDs.length;

	// Create a new JSZip instance
	const JSZip = (await import('jszip')).default;
	const zip = new JSZip();

	// Download each partition
	for (let i = 0; i < totalPartitions; i++) {
		const existingPartitionID = existingPartitionsIDs[i];
		progressCallback(i, totalPartitions);

		// Load the partition data
		const partitionData = await loadPartition(repositoryName, existingPartitionID);

		// Add it to the zip file
		zip.file(`${existingPartitionID}.json`, JSON.stringify(partitionData, null, 2));
	}

	// Final progress update
	progressCallback(totalPartitions, totalPartitions);

	// Generate the zip file
	return await zip.generateAsync({ type: "blob" });
}

export async function uploadRepositoryFromZip(
	file: File,
	repositoryName: string,
	progressCallback: (current: number, total: number) => void,
	handleExistingPartition: (partitionId: string) => Promise<'skip' | 'replace'>
): Promise<void> {
	const JSZip = (await import('jszip')).default;
	const zip = await JSZip.loadAsync(file);

	// Process each file in the zip
	const files = Object.values(zip.files).filter((zipFile): zipFile is import('jszip').JSZipObject => !zipFile.dir);
	const total = files.length;

	const existingPartitionsIDs = await listPartitionsIDs(repositoryName);

	for (let i = 0; i < files.length; i++) {
		const zipFile = files[i];
		progressCallback(i, total);

		const content = await zipFile.async('string');
		const partitionData: LionWebJsonChunk = JSON.parse(content);

		const rootsInPartitionData = partitionData.nodes.filter((node: LionWebJsonNode) => node.parent == null);
		if (rootsInPartitionData.length != 1) {
			throw new Error("Not a valid partition. Roots found: " + rootsInPartitionData.length);
		}

		const partitionID = rootsInPartitionData[0].id;
		const partitionExists = existingPartitionsIDs.includes(partitionID)
		let skip = false;
		if (partitionExists) {
			const action = await handleExistingPartition(partitionID);
			if (action === 'skip') {
				skip = true;
			} else if (action === 'replace') {
				await deletePartition(repositoryName, partitionData.nodes[0].id);
			} else {
				throw new Error("Unexpected situation")
			}
		}
		if (!skip) {
			await createPartition(repositoryName, partitionData);
		}
	}

	// Final progress update
	progressCallback(total, total);
}

// TODO remove this trivial function
export async function getPartitionsCount(repositoryName: string): Promise<number> {
	try {
		const partitionsIDs = await listPartitionsIDs(repositoryName);
		return partitionsIDs.length;
	} catch (e) {
		console.error('Error getting partitions count:', e);
		throw new Error(`Failed to get partitions count: ${e instanceof Error ? e.message : 'Unknown error'}`);
	}
}
