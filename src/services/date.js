export function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

export function formatTime(date) {
    const options = { hour: 'numeric', minute: 'numeric', second: 'numeric'};
    return date.toLocaleTimeString(undefined, options);
}