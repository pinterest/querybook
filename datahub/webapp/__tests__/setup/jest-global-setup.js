module.exports = async () => {
    // Picking this instead of America/Los_Angeles to
    // eliminate day light saving
    process.env.TZ = 'Pacific/Pitcairn';
};
