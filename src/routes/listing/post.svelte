<script>
	import { createListing } from '../_api';
	import { Form, Input, Select, Choice } from 'sveltejs-forms';

	async function handleSubmit({ detail: { values } }) {
		console.log(values);
		createListing('http://127.0.0.1:8000/create/', values)
	}

	const categories = [
		{ id: 1, title: 'engineering' },
		{ id: 2, title: 'software' }
	];

</script>

<Form let:isSubmitting on:submit={handleSubmit}>
	<Input name="company_name" label="company name" value="" />
	<Input name="job_title" label="job title" value="Software Developer" />
	<Input name="description" label="job description" value="" />
	<Select name="category" label="job category" options={categories} value="" />
	<Input name="salary" label="job salary" value="100" />
	<Input name="region" label="job region" value="London" />
	<Input name="website" label="job website" value="" />
	<Input name="profile_url" label="Profile Image Link" value="" />
	<button type="submit" disabled={isSubmitting}>Submit</button>
</Form>
