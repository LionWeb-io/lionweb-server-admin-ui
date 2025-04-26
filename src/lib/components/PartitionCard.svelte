<script lang="ts">
    import type { LionWebJsonChunk } from '@lionweb/repository-client';
    import type { LionWebJsonMetaPointer } from '@lionweb/validation';

    type PartitionData = { 
        id: string; 
        name?: string; 
        isLoaded?: boolean; 
        data?: LionWebJsonChunk; 
        metapointer?: LionWebJsonMetaPointer 
    };

    export let partition: PartitionData;
    export let onClick: (partition: PartitionData) => void;
</script>

<div 
    class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transition-shadow duration-200 cursor-pointer"
    on:click={() => onClick(partition)}
>
    <div class="px-6 py-4">
        <div class="flex flex-col">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="min-w-0">
                        {#if partition.name}
                            <h3 class="text-lg font-semibold text-gray-900">{partition.name}</h3>												
                        {/if}
                        <p class="text-xs text-gray-500 uppercase tracking-wide break-all max-w-[200px]">{partition.id}</p>
                        {#if partition.metapointer}
                            <span class="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                {partition.metapointer.language}:{partition.metapointer.version}:{partition.metapointer.key}
                            </span>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> 