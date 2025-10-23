export function generateSearchIndex(text) {
    if (!text || typeof text !== 'string' || text.trim() === '')
        return [];

    const sanitizedText = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '');

    let wordGroupsToAdd = [[]];
    for (let i = 0; i < sanitizedText.length; i++) {
        const char = sanitizedText[i];

        wordGroupsToAdd.forEach(function(wordGroupToAdd, i) {
            let previousWordInWordGroup = wordGroupToAdd[wordGroupToAdd.length-1] || '';
            wordGroupsToAdd[i].push(previousWordInWordGroup+char);
        });

        if (char == ' ' || char == '-')
            wordGroupsToAdd.push([]);
    }

    let search_keys = new Set();
    wordGroupsToAdd.forEach(function(wordGroupToAdd) {
        wordGroupToAdd.forEach(function(word) {
            search_keys.add(word);
        });
    });

    return Array.from(search_keys);
}

export function generateWordIndexFromRecipe(recipe) {
    if (!recipe)
        return [];

    let search_keys = new Set();
    recipe.ingredients && recipe.ingredients.forEach((ing) => {
        if (ing.name) {
            const sanitizedText = ing.name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '');

            const words = sanitizedText.split(' ');

            words.forEach((word) => {
                if (word.includes('-')) {
                    const parts = word.split('-');
                    parts.forEach((part) => {
                        search_keys.add(part);
                    })
                }
                
                search_keys.add(word);
            })
        }
    });

    return Array.from(search_keys);
}