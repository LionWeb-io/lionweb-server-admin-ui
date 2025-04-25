<script lang="ts">
	import '../app.css';
	import RepositoryPicker from '$lib/components/RepositoryPicker.svelte';
	import PartitionPicker from '$lib/components/PartitionPicker.svelte';
	import NodePicker from '$lib/components/NodePicker.svelte';
	import InstanceRootLink from '$lib/components/InstanceRootLink.svelte';
</script>

<div class="min-h-screen bg-gray-100">
	<nav class="bg-white shadow-lg">
		<div class="mx-auto px-4">
						<a href="/repositories" class="flex items-center space-x-2">
							<img src="/images/lionweb-logo.png" alt="LionWeb Logo" class="h-16 w-auto" />
							<span class="text-xl font-bold text-gray-800">LionWeb Repo Admin Panel</span>
							<span class="text-s text-gray-800">at http://localhost:3005</span>
						</a>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
<!--						<a-->
<!--							href="/repositories"-->
<!--							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"-->
<!--						>-->
<!--							Repositories-->
<!--						</a>-->
<!--						<a-->
<!--							href="/partitions"-->
<!--							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"-->
<!--						>-->
<!--							Partitions-->
<!--						</a>-->
<!--						<a-->
<!--							href="/files"-->
<!--							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"-->
<!--						>-->
<!--							Files-->
<!--						</a>-->
					</div>


		</div>
		<div class="breadcrumbs">
			<div class="step root">
				<InstanceRootLink/>
			</div>
			<div class="step repository">
				<RepositoryPicker/>
			</div>
			<div class="step partition">
				<PartitionPicker/>
			</div>
			<div class="step node">
				<NodePicker/>
			</div>
			<div class="step node">
				<NodePicker/>
			</div>
			<div class="step node">
				<NodePicker/>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<slot />
		</div>
	</main>
</div>

<style>

		.breadcrumbs {
				margin-top: 1rem;
				display: flex;
				padding: 10px;
		}

		.step.root {
				background-color: #0070f3;
		}

    .step {
        border-top: 1px black solid;
				display: inline-block;
				/*border: #2563eb solid 3px;*/
				/*border-radius: 15px;*/
				padding: 10px;
				/*margin: 10px 10px;*/
				border-right: 2px solid #0070f3;
				height: 48px;
				background-color: #e8e8e8;
		}

		.step:hover {
				background-color: #cccccc;
		}

    .step {
        display: inline-flex;
        align-items: center;
        padding: 0 15px;
        height: 48px;
        margin-right: 8px;
        background-color: #f9fafb;
        border: 2px solid #0070f3;
        border-radius: 18px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }

    .step:hover {
        background: linear-gradient(145deg, #e6e6e6, #ffffff);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
        transform: translateY(-3px);
    }

</style>
