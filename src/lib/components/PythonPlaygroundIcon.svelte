<script lang="ts">
    import { page } from '$app/stores';
</script>

<a 
    href="/playground" 
    class="flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-100 {($page.url.pathname === '/playground' ? 'bg-gray-100' : '')}"
    title="Python Playground"
>
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        class="text-blue-500"
    >
        <!-- Python logo base -->
        <path 
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" 
            fill="#3776AB"
        />
        <path 
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" 
            fill="url(#python-gradient)"
        />
        <!-- Python snake body -->
        <path 
            d="M12 6C9.79 6 8 7.79 8 10V14C8 16.21 9.79 18 12 18C14.21 18 16 16.21 16 14V10C16 7.79 14.21 6 12 6Z" 
            fill="#FFD43B"
        />
        <!-- Playground elements -->
        <path 
            d="M7 10C7 8.34 8.34 7 10 7H14C15.66 7 17 8.34 17 10V14C17 15.66 15.66 17 14 17H10C8.34 17 7 15.66 7 14V10Z" 
            fill="none" 
            stroke="#FFD43B" 
            stroke-width="2"
        />
        <path 
            d="M10 10H14M10 14H14" 
            stroke="#3776AB" 
            stroke-width="2" 
            stroke-linecap="round"
        />
    </svg>
    <span class="text-sm font-medium text-gray-700">Playground</span>
</a>

<style>
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    a:hover svg {
        animation: pulse 1s infinite;
    }
</style> 