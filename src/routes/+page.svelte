<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import { Plus, LogOut, Calendar, Pencil, Trash2, X, Check, WalletCards } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { format } from 'date-fns';
	import { es } from 'date-fns/locale';

	let { data } = $props();

	const categories = [
		'comida', 'transporte', 'casa', 'servicios',
		'entretenimiento', 'salud', 'compras', 'otros'
	];

	// Form state
	let amount = $state('');
	let selectedCategory = $state('comida');
	let note = $state('');
	let showSuccess = $state(false);
	let showBudgetForm = $state(false);
	let budgetValue = $state('');

	// Edit modal state
	let editingExpense = $state<{ id: number; amount: number; category: string; note: string | null; date: string } | null>(null);
	let editAmount = $state('');
	let editCategory = $state('');
	let editNote = $state('');
	let editDate = $state('');

	// Delete confirmation state
	let deletingId = $state<number | null>(null);

	// Budget calc
	const budget = $derived(data.quincenaBudget);
	const spent = $derived(data.quincenaTotal);
	const remaining = $derived(budget - spent);
	const progress = $derived(Math.min((spent / budget) * 100, 100));
	const progressColor = $derived(
		progress >= 100 ? '#ef4444' :
		progress >= 80  ? '#f97316' :
		progress >= 60  ? '#eab308' :
		'#22c55e'
	);

	function handleSuccess() {
		amount = '';
		note = '';
		showSuccess = true;
		setTimeout(() => (showSuccess = false), 2000);
		invalidateAll();
	}

	function openEdit(expense: typeof data.recentExpenses[0]) {
		editingExpense = { id: expense.id, amount: expense.amount, category: expense.category, note: expense.note, date: expense.date };
		editAmount = String(expense.amount);
		editCategory = expense.category;
		editNote = expense.note || '';
		editDate = expense.date;
	}

	function closeEdit() {
		editingExpense = null;
	}

	function openBudgetForm() {
		budgetValue = String(data.quincenaBudget);
		showBudgetForm = true;
	}

	function formatCurrency(n: number) {
		return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	// Quincena label
	const quincenaLabel = $derived.by(() => {
		const qStart = new Date(data.quincenaRange.start + 'T00:00:00');
		const qEnd = new Date(data.quincenaRange.end + 'T00:00:00');
		return `${format(qStart, 'd MMM', { locale: es })} – ${format(qEnd, 'd MMM', { locale: es })}`;
	});

	const categoryColors: Record<string, string> = {
		comida: '#ef4444',
		transporte: '#3b82f6',
		casa: '#14b8a6',
		servicios: '#eab308',
		entretenimiento: '#a855f7',
		salud: '#22c55e',
		compras: '#ec4899',
		otros: '#71717a'
	};

	function getExpenseColor(expense: typeof data.recentExpenses[0]) {
		return (expense as any).color || categoryColors[expense.category] || '#71717a';
	}
</script>

<div class="mx-auto max-w-md pb-24 pt-6 px-4">

	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<p class="text-[10px] font-bold uppercase tracking-widest text-primary">Corazón Azul</p>
			<h1 class="text-xl font-bold">Finanzas personales</h1>
			<p class="text-xs text-muted-foreground">
				Sesión activa: <span class="font-semibold capitalize text-foreground">{data.user.username}</span> · {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
			</p>
		</div>
		<div class="flex gap-1">
			<a href="/recurrentes" class="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted transition-colors" title="Gastos recurrentes">
				<Calendar size={20} />
			</a>
			<form method="POST" action="?/logout" use:enhance>
				<Button variant="ghost" size="icon" type="submit">
					<LogOut size={20} />
				</Button>
			</form>
		</div>
	</div>

	<!-- Quincena Budget Card -->
	<Card class="mb-6 p-5 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
		<div class="flex items-start justify-between mb-1">
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-wider opacity-70">Presupuesto inicial de quincena</p>
				<p class="text-[10px] opacity-50 mt-0.5">{quincenaLabel}</p>
			</div>
			<button
				type="button"
				class="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[10px] font-bold opacity-80 transition hover:opacity-100"
				onclick={openBudgetForm}
				title="Modificar presupuesto"
			>
				<WalletCards size={12} />
				{formatCurrency(budget)}
			</button>
		</div>

		{#if showBudgetForm}
			<form method="POST" action="?/updateBudget" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						showBudgetForm = false;
						invalidateAll();
					}
				};
			}} class="mb-4 mt-4 rounded-lg bg-white/10 p-3">
				<label for="budget" class="mb-2 block text-[10px] font-semibold uppercase tracking-wider opacity-70">Nuevo presupuesto inicial</label>
				<div class="flex gap-2">
					<div class="relative flex-1">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-70">$</span>
						<Input id="budget" name="budget" type="number" step="0.01" min="1" bind:value={budgetValue} class="border-white/20 bg-white/10 pl-7 text-primary-foreground placeholder:text-white/50" required />
					</div>
					<Button type="button" variant="ghost" class="px-3 text-primary-foreground hover:bg-white/10" onclick={() => showBudgetForm = false}>Cancelar</Button>
					<Button type="submit" class="bg-white text-primary hover:bg-white/90">Guardar</Button>
				</div>
			</form>
		{/if}

		<!-- Amounts -->
		<div class="mt-3 mb-4">
			<h2 class="text-4xl font-black tracking-tight">{formatCurrency(spent)}</h2>
			<p class="text-[10px] uppercase tracking-wider opacity-60">gastado hasta ahora</p>
			<p class="text-xs mt-1 opacity-80">
				{#if remaining >= 0}
					Te quedan <span class="font-bold">{formatCurrency(remaining)}</span>
				{:else}
					Excediste por <span class="font-bold text-red-300">{formatCurrency(Math.abs(remaining))}</span>
				{/if}
			</p>
		</div>

		<!-- Progress bar -->
		<div class="w-full h-2 bg-white/20 rounded-full overflow-hidden">
			<div
				class="h-full rounded-full transition-all duration-700"
				style="width: {progress}%; background-color: {progressColor};"
			></div>
		</div>
		<div class="mt-1 flex justify-between text-[10px] opacity-60">
			<span>{formatCurrency(remaining)} disponible</span>
			<span>{progress.toFixed(0)}% usado</span>
		</div>

		<!-- Per user -->
		{#if data.userTotals.length > 0}
			<div class="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
				{#each data.userTotals as ut}
					<div>
						<p class="text-[10px] uppercase opacity-60">{ut.username}</p>
						<p class="text-base font-bold">{formatCurrency(ut.total)}</p>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<!-- Quick Add Form -->
	<h3 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Registrar Gasto</h3>
	<Card class="mb-6 p-5">
		<form method="POST" action="?/addExpense" use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') handleSuccess();
			};
		}} class="space-y-3">
			<div class="flex gap-2">
				<div class="relative flex-1">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
					<Input
						name="amount"
						type="number"
						step="0.01"
						placeholder="0.00"
						bind:value={amount}
						class="pl-7 text-lg font-bold"
						required
					/>
				</div>
				<select
					name="category"
					bind:value={selectedCategory}
					class="w-32 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{#each categories as cat}
						<option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
					{/each}
				</select>
			</div>

			<div class="relative">
				<Input name="note" bind:value={note} placeholder="Nota opcional (ej. Walmart, Netflix)" class="pr-8" />
				{#if note}
					<button type="button" onclick={() => note = ''} class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
						<X size={14} />
					</button>
				{/if}
			</div>

			<Button type="submit" class="w-full gap-2">
				<Plus size={18} />
				Registrar Gasto
			</Button>

			{#if showSuccess}
				<p class="text-center text-xs font-medium text-green-500 flex items-center justify-center gap-1">
					<Check size={14} /> ¡Gasto guardado!
				</p>
			{/if}
		</form>
	</Card>

	<!-- Recurring quick-apply -->
	{#if data.recurring.length > 0}
		<h3 class="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Recurrentes — Aplicar a la quincena</h3>
		<p class="mb-3 text-[11px] leading-relaxed text-muted-foreground/70">
			Úsalos para tus pagos fijos: renta, servicios o suscripciones. No cuentan hasta que los registras como gasto.
		</p>
		<div class="mb-6 flex gap-2 overflow-x-auto pb-1">
			{#each data.recurring as item}
				<form method="POST" action="?/applyRecurring" use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							invalidateAll();
						}
					};
				}}>
					<input type="hidden" name="id" value={item.id} />
					<button
						type="submit"
						class="flex-shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium text-foreground transition-all active:scale-95"
						style="border-color: {item.color}55; background-color: {item.color}18;"
					>
						<span class="rounded-full p-1" style="background-color: {item.color}24; color: {item.color};">
							<CategoryIcon category={item.category} size={14} />
						</span>
						<span>{item.name}</span>
						<span class="font-black" style="color: {item.color};">{formatCurrency(item.amount)}</span>
					</button>
				</form>
			{/each}
		</div>
	{/if}

	<!-- Recent Expenses -->
	<h3 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Gastos de esta Quincena</h3>
	<div class="space-y-2">
		{#each data.recentExpenses as expense}
			{@const color = getExpenseColor(expense)}
			<Card class="flex items-center justify-between p-3.5 border-l-4" style="border-left-color: {color};">
				<div class="flex items-center gap-3 min-w-0">
					<div class="flex-shrink-0 rounded-full p-2" style="background-color: {color}22; color: {color};">
						<CategoryIcon category={expense.category} size={16} />
					</div>
					<div class="min-w-0">
						<p class="text-sm font-bold capitalize truncate">{expense.category}</p>
						<div class="flex items-center gap-1.5 flex-wrap">
							{#if expense.note}
								<span class="text-[10px] text-muted-foreground/70 italic truncate max-w-[150px]">{expense.note}</span>
								<span class="text-[10px] text-muted-foreground/40">•</span>
							{/if}
							<p class="text-[10px] text-muted-foreground">
								{expense.payer} · {format(new Date(expense.date + 'T00:00:00'), 'd MMM', { locale: es })}
							</p>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2 flex-shrink-0 ml-2">
					<p class="text-sm font-black" style="color: {color};">-{formatCurrency(expense.amount)}</p>

					<!-- Edit button -->
					<button onclick={() => openEdit(expense)} class="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
						<Pencil size={14} />
					</button>

					<!-- Delete button -->
					<button onclick={() => deletingId = expense.id} class="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded">
						<Trash2 size={14} />
					</button>
				</div>
			</Card>
		{:else}
			<p class="text-center text-sm text-muted-foreground py-10">Sin gastos esta quincena 🎉</p>
		{/each}
	</div>

	<!-- Category Breakdown -->
	{#if data.categoryBreakdown.length > 0}
		<h3 class="mt-8 mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Por Categoría</h3>
		<div class="grid grid-cols-2 gap-2">
			{#each data.categoryBreakdown as cat}
				<Card class="p-3.5">
					<div class="mb-1.5 text-muted-foreground">
						<CategoryIcon category={cat.category} size={15} />
					</div>
					<p class="text-[10px] uppercase text-muted-foreground">{cat.category}</p>
					<p class="text-sm font-bold">{formatCurrency(cat.total)}</p>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- ============ EDIT MODAL ============ -->
{#if editingExpense}
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<button type="button" aria-label="Cerrar edición" class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={closeEdit}></button>
		<div class="relative w-full max-w-md rounded-t-2xl bg-background border-t border-border p-6 space-y-4 animate-slideup">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-bold">Editar Gasto</h2>
				<button onclick={closeEdit} class="text-muted-foreground hover:text-foreground"><X size={20} /></button>
			</div>

			<form method="POST" action="?/editExpense" use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						closeEdit();
					}
				};
			}} class="space-y-3">
				<input type="hidden" name="id" value={editingExpense.id} />

				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
					<Input name="amount" type="number" step="0.01" bind:value={editAmount} class="pl-7 text-lg font-bold" required />
				</div>

				<select name="category" bind:value={editCategory}
					class="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
					{#each categories as cat}
						<option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
					{/each}
				</select>

				<Input name="date" type="date" bind:value={editDate} required />
				<Input name="note" bind:value={editNote} placeholder="Nota opcional" />

				<div class="flex gap-2 pt-1">
					<Button variant="outline" class="flex-1" type="button" onclick={closeEdit}>Cancelar</Button>
					<Button type="submit" class="flex-1 gap-1"><Check size={16} /> Guardar</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============ DELETE CONFIRM MODAL ============ -->
{#if deletingId !== null}
	<div class="fixed inset-0 z-50 flex items-center justify-center px-6">
		<button type="button" aria-label="Cancelar eliminación" class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={() => deletingId = null}></button>
		<div class="relative w-full max-w-xs rounded-2xl bg-background border border-border p-6 space-y-4 shadow-xl">
			<div class="text-center">
				<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
					<Trash2 size={22} />
				</div>
				<h2 class="text-base font-bold">¿Eliminar gasto?</h2>
				<p class="text-xs text-muted-foreground mt-1">Esta acción no se puede deshacer.</p>
			</div>

			<form method="POST" action="?/deleteExpense" use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						deletingId = null;
					}
				};
			}}>
				<input type="hidden" name="id" value={deletingId} />
				<div class="flex gap-2">
					<Button variant="outline" class="flex-1" type="button" onclick={() => deletingId = null}>Cancelar</Button>
					<Button type="submit" class="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1">
						<Trash2 size={15} /> Eliminar
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		background-color: #0c0c0e;
	}

	@keyframes slideup {
		from { transform: translateY(100%); opacity: 0; }
		to   { transform: translateY(0);    opacity: 1; }
	}
	.animate-slideup {
		animation: slideup 0.25s ease-out;
	}
</style>
