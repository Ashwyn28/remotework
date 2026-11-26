import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess({})],

	kit: {
		// static files for S3 + CloudFront; every unknown path falls back to the app shell
		adapter: adapter({ pages: 'build', assets: 'build', fallback: 'index.html' }),
		prerender: { default: false },

		vite: {
			server: {
				proxy: {
					// The chat agent: by default the deployed one, so local development needs no
					// Anthropic credentials. It only answers requests from the site's origin, so
					// the proxy presents that. Set AGENT_API=http://127.0.0.1:8787 to use the local
					// dev server instead (which calls Claude with this machine's ANTHROPIC_API_KEY).
					// Listed before '/api' so it wins.
					'/api/agent': {
						target: process.env.AGENT_API || 'https://jobs.orbbits.io',
						changeOrigin: true,
						configure: (proxy) => {
							if (!process.env.AGENT_API)
								proxy.on('proxyReq', (req) => req.setHeader('origin', 'https://jobs.orbbits.io'));
						}
					},
					// the same paths CloudFront routes in production, served by
					// `python -m jobapi.devserver` in the backend repo
					'/api': { target: 'http://127.0.0.1:8787', changeOrigin: false },
					'/data': { target: 'http://127.0.0.1:8787', changeOrigin: false },
					'/static': { target: 'http://127.0.0.1:8787', changeOrigin: false }
				}
			}
		}

		// hydrate the <div id="svelte"> element in src/app.html
		// target: '#svelte'
	}
};

export default config;
