const API_KEY = "76b5d53a-2130-4e1b-af48-46203bd7650a";

/**
 * Creates a configuration object for an autoComplete.js instance.
 * This avoids code duplication for the start and end inputs.
 * @param {string} selector - The CSS selector for the input field.
 * @param {string} placeHolder - The placeholder text for the input.
 * @returns {object} The configuration object for autoComplete.js.
 */
const createAutoCompleteConfig = (selector, placeHolder) => ({
    selector,
    placeHolder,
    data: {
        src: async (query) => {
            try {
                const url = `https://corsproxy.io/?https://api.tisseo.fr/v2/places.json?term=${query}&key=${API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.placesList && data.placesList.place) {
                    // Ensure 'place' is always an array.
                    const places = Array.isArray(data.placesList.place)
                        ? data.placesList.place
                        : [data.placesList.place];
                    // BEST PRACTICE: Return the array of objects directly.
                    return places;
                }
                return [];
            } catch (error) {
                console.error("API Fetch Error:", error);
                return [];
            }
        },
        // Tell the library which key in our objects contains the visible text
        keys: ["label"],
        cache: true,
    },
    debounce: 300,
    trigger: {
        event: ["input"],
        condition: (query) => query.length > 2,
    },
    resultItem: {
        highlight: true,
    },
});

// --- Initialize both autocomplete inputs using the factory function ---
const autoCompleteStart = new autoComplete(createAutoCompleteConfig("#input-start", "Saisir votre point de départ..."));
const autoCompleteEnd = new autoComplete(createAutoCompleteConfig("#Input-end", "Saisir votre point d'arrivée..."));