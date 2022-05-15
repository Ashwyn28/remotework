import type { EndpointOutput } from '@sveltejs/kit';

const BASE = 'http://127.0.0.1:8000';

export const get = async (resource: string): Promise<EndpointOutput> => {
    try {
        const res = await fetch(`${BASE}/${resource}`, {
            headers: {
                'content-type': 'application/json'
            }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (error) {
        console.log(error)
    }
}

export const getListings = async (resource: string): Promise<EndpointOutput> => {
    try {
        const res = await get(resource);
        return res;
    } catch (error) {
        console.log(error)
    }
}

export const nextPage = async (resource: string): Promise<EndpointOutput> => {
    try {
        const res = await fetch(resource, {
            headers: {
                'content-type': 'application/json'
            }
        })
        if (res.ok) {
            return await res.json();
        }
    } catch (error) {
        console.log(error)
    }
}

export const createListing = async (resource: string, data: JSON): Promise<EndpointOutput> => {
    try {
        const res = await fetch(resource, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(data)
		});
        if (res.ok) {
            window.location.assign('http://localhost:3000/pay/confirm')
        }
    } catch (error) {
        console.log(error)
    }
}

