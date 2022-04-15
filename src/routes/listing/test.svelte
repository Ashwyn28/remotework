<script>
	import { Form, Input, Select, Choice } from 'sveltejs-forms';

	async function handleSubmit({ detail: { values, setSubmitting, resetForm } }) {
		const selectedFile = document.getElementById('profile_image').files[0];
		console.log(selectedFile);
		console.log(values);
		const data = {
			...values,
			profile_image: selectedFile
		};
		console.log(data);
		const res = await fetch('http://127.0.0.1:8000/listing/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(values)
		});
		setSubmitting(true);
		if (res.ok) {
			setSubmitting(false);
		}
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
	<input
		id="profile_image"
		label="profile image"
		type="file"
		class="block w-full text-sm text-slate-500
      file:mr-4 file:py-2 file:px-4
      file:rounded-full file:border-0
      file:text-sm file:font-semibold
      file:bg-violet-50 file:text-violet-700
      hover:file:bg-violet-100
    "
		multiple
	/>
	<button type="submit" disabled={isSubmitting}>Submit</button>
</Form>


<form action="http://127.0.0.1:8000/create-checkout-session/" method="POST">
	<button type="submit">Checkout</button>
</form>