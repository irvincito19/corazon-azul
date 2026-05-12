<script lang="ts">
	import { clsx, type ClassValue } from 'clsx';
	import { twMerge } from 'tailwind-merge';

	function cn(...inputs: ClassValue[]) {
		return twMerge(clsx(inputs));
	}

	let { 
		children, 
		class: className = '', 
		variant = 'default', 
		size = 'default',
		...props 
	} = $props();

	const variants = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		destructive: 'bg-red-500 text-white hover:bg-red-500/90',
		outline: 'border border-border bg-transparent hover:bg-muted hover:text-foreground',
		secondary: 'bg-muted text-foreground hover:bg-muted/80',
		ghost: 'hover:bg-muted hover:text-foreground',
		link: 'text-primary underline-offset-4 hover:underline'
	};

	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 rounded-md px-3',
		lg: 'h-11 rounded-md px-8',
		icon: 'h-10 w-10'
	};
</script>

<button
	class={cn(
		'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
		variants[variant as keyof typeof variants],
		sizes[size as keyof typeof sizes],
		className
	)}
	{...props}
>
	{@render children()}
</button>
