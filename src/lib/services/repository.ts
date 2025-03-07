import type { Repository, RepositoryListResponse, CreateRepositoryRequest, Partition, PartitionListResponse, BulkListPartitionsResponse, CreatePartitionRequest } from '$lib/types';
import type { SerializationChunk } from '@lionweb/core';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }
  return response.json();
}

export async function getRepositories(): Promise<RepositoryListResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/listRepositories`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    const data = await handleResponse(response);
    console.log('Raw API response:', JSON.stringify(data, null, 2));
    
    // Pass through the full repository information
    return {
      success: data.success,
      repositories: data.repositories || [],
      messages: data.messages || []
    };
  } catch (e) {
    console.error('Error fetching repositories:', e);
    throw new Error(`Failed to fetch repositories: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function getRepository(id: string): Promise<Repository> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/repositories/${id}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  } catch (e) {
    console.error('Error fetching repository:', e);
    throw new Error(`Failed to fetch repository: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function createRepository(repository: CreateRepositoryRequest): Promise<Repository> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/repositories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(repository),
    });
    return handleResponse(response);
  } catch (e) {
    console.error('Error creating repository:', e);
    throw new Error(`Failed to create repository: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function updateRepository(id: string, repository: Partial<Repository>): Promise<Repository> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/repositories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(repository),
    });
    return handleResponse(response);
  } catch (e) {
    console.error('Error updating repository:', e);
    throw new Error(`Failed to update repository: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function deleteRepository(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/repositories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
  } catch (e) {
    console.error('Error deleting repository:', e);
    throw new Error(`Failed to delete repository: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function getPartitions(repositoryName: string): Promise<PartitionListResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/bulk/listPartitions?clientId=lionWebRepoAdminUI&repository=${encodeURIComponent(repositoryName)}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    const data = await handleResponse(response);
    console.log('Raw Partitions API response:', JSON.stringify(data, null, 2));
    
    // Extract partition IDs from the nested structure
    const partitionIds = data?.chunk?.nodes?.map((node: { id: string }) => node.id) || [];
    console.log('Extracted partition IDs:', partitionIds);
    
    // Convert the response to our expected format
    const partitions = partitionIds.map((id: string) => ({
      id,
      name: id, // Using ID as name since we don't have the actual name
      nodeCount: 0, // We'll need to fetch this separately if needed
      createdAt: new Date().toISOString(), // We'll need to fetch this separately if needed
      updatedAt: new Date().toISOString() // We'll need to fetch this separately if needed
    }));
    console.log('Transformed partitions:', partitions);
    
    return {
      partitions,
      total: partitionIds.length
    };
  } catch (e) {
    console.error('Error fetching partitions:', e);
    throw new Error(`Failed to fetch partitions: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function getPartition(repositoryName: string, partitionId: string): Promise<Partition> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/repositories/${repositoryName}/partitions/${partitionId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    return handleResponse(response);
  } catch (e) {
    console.error('Error fetching partition:', e);
    throw new Error(`Failed to fetch partition: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function createPartition(repositoryName: string, chunk: SerializationChunk): Promise<Partition> {
  console.log('Creating partition with data:', {
    repositoryName,
    chunk: JSON.stringify(chunk, null, 2)
  });

  const response = await fetch(
    `${API_BASE_URL}/bulk/createPartitions?clientId=lionWebRepoAdminUI&repository=${encodeURIComponent(repositoryName)}`,
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
    nodeCount: chunk.nodes.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return partition;
} 