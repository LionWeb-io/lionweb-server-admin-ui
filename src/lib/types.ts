import type { SerializationChunk } from '@lionweb/core';

export interface Repository {
  id: string;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  version: string;
  languages: string[];
}

export interface RepositoryListResponse {
  repositories: Repository[];
  total: number;
  page: number;
  pageSize: number;
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
  name: string;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
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