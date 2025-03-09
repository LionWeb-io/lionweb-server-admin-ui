import type { Repository, RepositoryListResponse, CreateRepositoryRequest, Partition, PartitionListResponse, BulkListPartitionsResponse, CreatePartitionRequest } from '$lib/types';
import type { SerializationChunk } from '@lionweb/core';

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

export async function getRepositories(): Promise<RepositoryListResponse> {
  try {
    const params = new URLSearchParams({
      clientId: CLIENT_ID
    });

    const response = await fetch(
      `${API_BASE_URL}/listRepositories?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    const data = await handleResponse(response);
    
    // Map the server response to our expected format
    const mappedRepositories = (data.repositories as ServerRepository[])?.map(repo => ({
      repository_name: repo.name,
      lionweb_version: repo.lionweb_version,
      history: repo.history,
      schema_name: repo.schema_name || ''
    })) || [];
    
    return {
      success: data.success,
      repositories: mappedRepositories,
      messages: data.messages || []
    };
  } catch (e) {
    console.error('Error fetching repositories:', e);
    throw new Error(`Failed to fetch repositories: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function createRepository(repository: { name: string, lionweb_version: string, history: boolean }): Promise<Repository> {
  try {
    const params = new URLSearchParams({
      repository: repository.name,
      lionWebVersion: repository.lionweb_version,
      clientId: CLIENT_ID,
      history: repository.history.toString()
    });

    const response = await fetch(
      `${API_BASE_URL}/createRepository?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error('Server response was not valid JSON');
    }  
    
    // Handle error cases
    if (!response.ok || !data.success) {
      const errorMessage = data.messages?.[0]?.message || 'Failed to create repository';
      console.error('Error creating repository:', errorMessage);
      throw new Error(errorMessage);
    }
    
    return data.repository;
  } catch (e) {
    console.error('Error creating repository:', e);
    throw e; // Re-throw the error to handle it in the component
  }
}

export async function deleteRepository(repositoryName: string): Promise<void> {
  try {
    const params = new URLSearchParams({
      repository: repositoryName,
      clientId: CLIENT_ID
    });

    const response = await fetch(
      `${API_BASE_URL}/deleteRepository?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    const data = await handleResponse(response);
    if (!data.success) {
      throw new Error(data.messages?.[0]?.message || 'Failed to delete repository');
    }
  } catch (e) {
    console.error('Error deleting repository:', e);
    throw new Error(`Failed to delete repository: ${e instanceof Error ? e.message : 'Unknown error'}`);
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