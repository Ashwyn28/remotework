<script>
</script>

<svelte:head>
	<script src="https://accounts.google.com/gsi/client" async defer></script>
	<script>
		const handleCredentialResponse = async (response) => {
			console.log('Encoded JWT ID token: ' + response.credential);
			// store google token in localstorage
			window.localStorage.setItem('google_token', response.credential);
			if (window.localStorage.getItem('google_token')) {
				// redirect to main dashboard page
				window.location = '/business/main';
			}
		};

		window.onload = function () {
			google.accounts.id.initialize({
				client_id: '601837645469-i46geu02ca7rthamniuehgkp5ithjbl9.apps.googleusercontent.com',
				callback: handleCredentialResponse
			});
			google.accounts.id.renderButton(
				document.getElementById('buttonDiv'),
				{ theme: 'outline', size: 'large' } // customization attributes
			);
			debugger;
			google.accounts.id.prompt(); // also display the One Tap dialog
		};
	</script>
</svelte:head>

<div>Business Dashboard</div>
