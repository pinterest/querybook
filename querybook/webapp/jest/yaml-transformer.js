const yaml = require('js-yaml');

module.exports = {
    process: (src, filename) => {
        if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
            const data = yaml.load(src);
            return `module.exports = ${JSON.stringify(data)};`;
        }
        return src;
    },
};
