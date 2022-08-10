const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MigrationSchema = new Schema({
    client: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    totals: {
        type: Map,
        of: Number    
    }
});

module.exports = mongoose.model('Migration', MigrationSchema);
