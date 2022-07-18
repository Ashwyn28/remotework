<script lang="ts">
	import { Form, Input } from 'sveltejs-forms';
</script>

<div>
	<p class="text-center text-4xl dark:text-white font-bold text-black">
		Find the right place for you <i class="pl-2 fa-solid fa-user-astronaut" />
	</p>
	<p class="text-center text-slate-400">
		Our job board is curated to provide you the best work from home opportunities.
	</p>
	<div class="text-center">
		<Form>
			<div class="flex flex-row justify-center">
				<Input class="text-sm rounded" name="email" placeholder="Enter your email.." value="" />
				<button
					type="submit"
					class="ml-1 px-4 py-0 my-0 bg-send-green text-white hover:text-send-green hover:bg-white dark:hover:bg-slate-800 rounded invisible sm:visible text-sm font-semibold hover:ring-2 hover:ring-send-green"
					>Get Started</button
				>
			</div>
		</Form>
	</div>
</div>

<style>
	:global(.sveltejs-forms) {
		padding: 1rem;
		border-radius: 5px;
	}

	:global(label) {
		font-size: 0.8rem;
		color: #888;
		margin-bottom: 0.2rem;
	}

	:global(.message) {
		font-size: 0.8rem;
		color: #ffff;
		margin: 0.2rem 0;
		color: #f56565;
	}

	:global(input[type='text']),
	:global(textarea),
	:global(select) {
		height: 30px;
		background-color: white;
		margin: 0;
	}

	:global(input[type='checkbox'] + label) {
		display: inline-block;
		margin-right: 2rem;
	}

	:global(.field) {
		margin-bottom: 1rem;
	}

	.buttons {
		margin-top: 0.8rem;
		display: flex;
		align-items: center;
	}

	button[type='reset'] {
		background-color: #f56565;
	}

	button[type='submit'] {
		height: 30px;
	}

	.debugger {
		margin-top: 1rem;
	}
</style>
