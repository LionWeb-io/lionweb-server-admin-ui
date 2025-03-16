export interface Partition {
	id: string;
}

export interface PartitionListResponse {
	partitions: Partition[];
	total: number;
}
