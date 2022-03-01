const NOOP = () => {
    /* noop function */
};

export const stopPropagation = (e: React.UIEvent) => {
    e.stopPropagation();
};

export const stopPropagationAndDefault = (e: React.UIEvent | Event) => {
    e.stopPropagation();
    e.preventDefault();
};

export default NOOP;
