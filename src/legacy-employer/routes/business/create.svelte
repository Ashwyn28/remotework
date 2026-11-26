<script>
	import { Form, Input, Select } from 'sveltejs-forms';

	const handleSubmit = async ({ detail: { values } }) => {};
	const categories = [{ id: 1, title: '' }];
</script>

<div
	id="g_id_onload"
	data-client_id="601837645469-i46geu02ca7rthamniuehgkp5ithjbl9.apps.googleusercontent.com"
	data-login_uri="http://localhost:3000/business/dashboard"
	data-native_login_uri="http://localhost:3000/business/create"
/>
<div class="flex flex-row-reverse">
	<div class="basis-1/2 form-background">
		<Form let:isSubmitting on:submit={handleSubmit}>
			<Input name="company_name" label="company name" value="" />
			<Input name="description" label="business description" value="" />
			<Select name="category" label="business category" options={categories} value="" />
			<Input name="website" label="business website" value="" />
			<Input name="profile_url" label="Profile Image Link" value="" />
			<Input name="application_url" label="Application Link" value="" />
			<div class="buttons">
				<button type="submit" disabled={isSubmitting}>Submit</button>
				<button type="reset">Clear</button>
			</div>
		</Form>
	</div>
</div>

<style>
	.form-background {
		background-color: #f8f8f8;
		padding: 1rem;
		border: 1px solid #ccc;
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
		width: 100%;
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

	button {
		border-radius: 5px;
		padding: 0.5rem 1rem;
		margin-right: 1rem;
		color: white;
	}

	button[type='reset'] {
		background-color: #f56565;
	}

	button[type='submit'] {
		background-color: #48bb78;
		width: 80px;
	}
</style>
