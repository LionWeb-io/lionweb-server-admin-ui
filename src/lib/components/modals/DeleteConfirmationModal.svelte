<script lang="ts">
	import type { RepositoryConfiguration } from '@lionweb/repository-shared';

	export let show: boolean;
	export let repository: RepositoryConfiguration | null;
	export let onClose: () => void;
	export let onConfirm: () => Promise<void>;
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
			aria-hidden="true"
		></div>
		<div class="fixed inset-0 z-60 flex items-center justify-center px-4 text-center">
			<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
			<div
				class="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
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
							Delete Repository
						</h3>
						<div class="mt-2">
							<p class="text-sm text-gray-500">
								Are you sure you want to delete the repository "{repository?.name}"? This action cannot be
								undone.
							</p>
						</div>
					</div>
				</div>
				<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						on:click={onConfirm}
						class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
					>
						Delete
					</button>
					<button
						type="button"
						on:click={onClose}
						class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if} 