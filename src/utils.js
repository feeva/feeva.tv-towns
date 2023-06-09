const toDateObject = d => {
    if (d) {
        const t = typeof(d);

        if (t === 'number' || t === 'string')
            return new Date(d);

        if (d.getFullYear)
            return d;
    }
}

function formatDate(date, opt) {
    const d = toDateObject(date);
    if (!d) return '';
  
    return d.toLocaleDateString(undefined, opt || { dateStyle: 'medium' });
};

function debounce(fn) {
    let timout;

    return function(...args) {
        const context = this;
        clearTimeout(timout);
        timout = setTimeout(() => fn.apply(context, args), 400);
    }
}
  
export { formatDate , debounce };
