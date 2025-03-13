import type { SerializationChunk } from '@lionweb/core';

export interface Repository {
  repository_name: string;
  schema_name: string;
  history: boolean;
  lionweb_version: string;
  created?: string;
}

export interface RepositoryListResponse {
  success: boolean;
  repositories: Repository[];
  messages: Array<{
    kind: string;
    message: string;
  }>;
}

export interface CreateRepositoryRequest {
  name: string;
  description: string;
  owner: string;
  version: string;
  languages: string[];
}

export interface Partition {
  id: string;
}

export interface PartitionListResponse {
  partitions: Partition[];
  total: number;
}

export interface BulkListPartitionsResponse {
  partitionIds: string[];
  total: number;
}

export interface CreatePartitionRequest {
  chunk: SerializationChunk;
} 