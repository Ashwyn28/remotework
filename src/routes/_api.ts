import type { EndpointOutput } from '@sveltejs/kit';

const BASE = 'http://127.0.0.1:8000';

/**
 * create generic get fetch call
 * @param {string} resource 
 * @returns {Promise<EndpointOutput>}
 */
export const get = async (resource: string): Promise<EndpointOutput> => {
    try {
        const res = await fetch(`${BASE}/${resource}`, {
            headers: {
                'content-type': 'application/json'
            }
        });
        if (res.ok) {
            return res.json();
        }
    } catch (error) {
        console.log(error)
    }
}

/**
 * create generic get fetch call
 * @param {string} resource 
 * @returns {Promise<EndpointOutput>}
 */
export const getAuth = async (resource: string, formattedToken: string): Promise<EndpointOutput> => {
    try {
        const res = await fetch(`${BASE}/${resource}`, {
            headers: {
                'content-type': 'application/json',
                'Authorization': formattedToken
            }
        });
        if (res.ok) {
            return res.json();
        }
    } catch (error) {
        console.log(error)
    }
}

export const post = async (resource: string, data: any): Promise<EndpointOutput> => {
    try {
        const res = await fetch(resource, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            return res.json();
        }
    } catch (error) {
        console.log(error)
    }
}

/**
 * paginated listings 
 * @param {string} resource 
 * @returns {Promise<EndpointOutput>}
 */
export const getListings = async (resource: string): Promise<EndpointOutput> => {
    try {
        const res = await get(resource);
        return res;
    } catch (error) {
        console.log(error)
    }
}

/**
 * goto next page in paginated list api view
 * @param {string} resource 
 * @returns {Promise<EndpointOutput>}
 */
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

/**
 * post/add a listing by passing the following data;
 * { 
 *  'company_name', 'job_title', 'description', 
 *  'category', 'salary', 'region',  
 *  'profile_url', 'application_url' 
 * }
 * @param {string} resource 
 * @param {JSON} data 
 */
export const createListing = async (resource: string, data: JSON): Promise<EndpointOutput> => {
    try {
        const res = await post(resource, data)
        return res;
    } catch (error) {
        console.log(error)
    }
}

/**
 * validate google jwt  
 * @param {string} token 
 * @returns 
 */
export const authToken = async (resource: string, token: string): Promise<EndpointOutput> => {
    try {
        const res = await post(resource, token)
        return res;
    } catch (error) {
        console.log(error)
    }
}

/**
 * get user  
 * @param {string} resource 
 * @returns 
 */
export const user = async (resource: string, formattedToken: string): Promise<EndpointOutput> => {
    try {
        const res = await getAuth(resource, formattedToken)
        return res;
    } catch (error) {
        console.log(error)
    }
}