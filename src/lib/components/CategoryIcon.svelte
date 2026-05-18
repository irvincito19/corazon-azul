<script lang="ts">
	import { 
		Utensils, Car, Home, Zap, 
		Play, HeartPulse, ShoppingBag, MoreHorizontal, ShoppingCart,
		ArrowDownRight, ArrowUpRight, Plus, LogOut, Wallet
	} from 'lucide-svelte';

	let { category, size = 20 } = $props();

	const icons = {
		comida: Utensils,
		transporte: Car,
		casa: Home,
		servicios: Zap,
		entretenimiento: Play,
		salud: HeartPulse,
		compras: ShoppingBag,
		despensa: ShoppingCart,
		otros: MoreHorizontal
	};

	const Icon = $derived(icons[category as keyof typeof icons] || MoreHorizontal);
</script>

<Icon {size} />
