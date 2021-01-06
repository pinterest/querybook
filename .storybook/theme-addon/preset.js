module.exports = {
    config(entry = []) {
        return [...entry, require.resolve('./addThemeDecorator')];
    },
    managerEntries(entry = []) {
        return [...entry, require.resolve('./register')];
    },
};
