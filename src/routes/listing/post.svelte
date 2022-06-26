<script>
	import { createListing } from '../_api';
	import { Form, Input, Select, Choice } from 'sveltejs-forms';
	import { currentPaidForListingId } from "$lib/store"; 

	async function handleSubmit({ detail: { values } }) {
		console.log(values);
		let listing = await createListing('http://127.0.0.1:8000/create/', values);
		if (listing) {
			currentPaidForListingId.setWithLocalStorage({id: listing.id});
			window.location.assign('http://localhost:3000/pay/' + listing.id + '/confirm');
		}
	}

	// TODO:
	// validation!!

	const categories = [
		{ id: 1, title: 'engineering' },
		{ id: 2, title: 'software' }
	];
</script>

<style>
  :global(.sveltejs-forms) {
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

  .debugger {
    margin-top: 1rem;
  }
</style>

<div class="flex flex-row-reverse">
	<div class="basis-1/2">
		<Form let:isSubmitting on:submit={handleSubmit}>
			<Input name="company_name" label="company name" value="" />
			<Input name="job_title" label="job title" value="Software Developer" />
			<Input name="description" label="job description" value="" />
			<Select name="category" label="job category" options={categories} value="" />
			<div class="flex flex-row basis-1/2">
				<Input name="salary" label="job salary" value="100" />
				<Input name="region" label="job region" value="London" />
			</div>
			<Input name="website" label="job website" value="" />
			<Input name="profile_url" label="Profile Image Link" value="" />
			<Input name="application_url" label="Application Link" value="" />
			<div class="buttons">
				<button type="submit" disabled={isSubmitting}>Submit</button>
				<button type="reset">Clear</button>
			</div>
		</Form>
	</div>
</div>
