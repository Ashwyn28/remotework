import { browser } from "$app/env";

export const goto = (url) => {
    if (browser) {
        window.location.href = url
    }
}