import type { Repository, RepositoryListResponse, CreateRepositoryRequest, Partition, PartitionListResponse, BulkListPartitionsResponse, CreatePartitionRequest } from '$lib/types';
import type { SerializationChunk } from '@lionweb/core';
import { RepositoryClient } from '@lionweb/repository-client';
import type { ListRepositoriesResponse, RepositoryConfiguration, LionWebVersionType } from '@lionweb/repository-client';

/*
 * In the future, we should use the lionweb-repository client module.
 * We do not use it yet, as at the moment is not browser compatible 
 * (see https://github.com/lionweb-org/lionweb-repository/issues/101).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
const CLIENT_ID = 'lionWebRepoAdminUI';

// Server response type
interface ServerRepository {
  name: string;
  lionweb_version: string;
  history: boolean;
  schema_name?: string;
}

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

export async function createRepository(repositoryConfiguration: RepositoryConfiguration): Promise<void> {
  const client = new RepositoryClient(CLIENT_ID, null);
  const response = await client.dbAdmin.createRepository(
    repositoryConfiguration.name, repositoryConfiguration.history, repositoryConfiguration.lionweb_version as LionWebVersionType);
  if (response.body.success) {
    return
  } else {
    console.error('Error creating repositories:', response.body.messages);
    throw new Error(`Failed to create repositories: ${response.body.messages}`);
  }
}

export async function deleteRepository(repositoryName: string): Promise<void> {
  const client = new RepositoryClient(CLIENT_ID, null);
  const response = await client.dbAdmin.deleteRepository(repositoryName);
  if (response.body.success) {
    return
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

    const response = await fetch(
      `${API_BASE_URL}/bulk/listPartitions?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    const data = await handleResponse(response);
    
    // Extract partition IDs from the nested structure
    const partitionIds = data?.chunk?.nodes?.map((node: { id: string }) => node.id) || [];
    
    // Convert the response to our expected format
    const partitions = partitionIds.map((id: string) => ({
      id,
      name: id, // Using ID as name since we don't have the actual name
    }));
    
    return {
      partitions,
      total: partitionIds.length
    };
  } catch (e) {
    console.error('Error fetching partitions:', e);
    throw new Error(`Failed to fetch partitions: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function createPartition(repositoryName: string, chunk: SerializationChunk): Promise<Partition> {
  console.log('Creating partition with data:', {
    repositoryName,
    chunk: JSON.stringify(chunk, null, 2)
  });

  const params = new URLSearchParams({
    clientId: CLIENT_ID,
    repository: repositoryName
  });

  const response = await fetch(
    `${API_BASE_URL}/bulk/createPartitions?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    }
  );

  const responseData = await response.json();
  console.log('Create partition response:', responseData);

  if (!response.ok) {
    throw new Error(responseData.error || 'Failed to create partition');
  }

  if (!responseData.success) {
    throw new Error('Failed to create partition: ' + (responseData.messages?.[0]?.message || 'Unknown error'));
  }

  // Extract the partition ID from the response messages
  const versionMessage = responseData.messages?.find((msg: any) => msg.kind === 'RepoVersion');
  if (!versionMessage) {
    throw new Error('No version information found in response');
  }

  // Create a partition object with the available information
  const partition: Partition = {
    id: versionMessage.data.version,
    name: `Partition ${versionMessage.data.version}`,
  };

  return partition;
} 