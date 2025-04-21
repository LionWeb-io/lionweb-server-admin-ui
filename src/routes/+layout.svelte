<script lang="ts">
	import '../app.css';

	import { onMount } from 'svelte';
	import { getUserInfo } from '$lib/utils/user';
	import { LogOut, User } from 'lucide-svelte';

	let user: { name: string } | null = null;

	onMount(async () => {
		user = await getUserInfo();
	});

	function logout() {
		const keycloakLogoutUrl = encodeURIComponent(
			'http://localhost:8080/realms/lwrepo/protocol/openid-connect/logout'
		);
		window.location.href = `/oauth2/sign_out?rd=${keycloakLogoutUrl}`;
	}
</script>

<div class="min-h-screen bg-gray-100">
	<nav class="bg-white shadow-lg">
		<div class="mx-auto max-w-7xl px-4">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<a href="/repositories" class="flex items-center space-x-2">
							<img src="/images/lionweb-logo.png" alt="LionWeb Logo" class="h-8 w-auto" />
							<span class="text-xl font-bold text-gray-800">LionWeb Repo Admin Panel</span>
						</a>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a
							href="/repositories"
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Repositories
						</a>
						<a
							href="/partitions"
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Partitions
						</a>
						<a
							href="/files"
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Files
						</a>

						{#if user}
							<div class="logged-in-block">
								<User size={16} />
								<span class="username">{user.name}</span>
								<button on:click={logout} class="logout"><LogOut size={16} style="margin-right: 0.25rem;" /></button>
							</div>
						{/if}
					</div>
				</div>
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
    .logged-in-block {
        display: flex;
        align-items: center;
        gap: 1rem;
        background-color: #f5f5f5;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-size: 0.95rem;
        color: #333;
				text-align: center;
    }

    .user-info {
        font-weight: 500;
    }

    .username {
        font-weight: bold;
        color: #007acc;
    }

    .logout {
        background-color: transparent;
        border: 1px solid #007acc;
        border-radius: 4px;
        padding: 0.4rem 0.75rem;
        font-size: 0.9rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .logout:hover {
        background-color: #007acc;
        color: white;
    }
</style>
