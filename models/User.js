const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        uniue: true
    },
    email: {
        type: String,
        required: true,
        uniue: true
    }
    ,password: {
        type: String,
        required: true,
    },
    migrations: {
        type: Array,
        default: []
    },
    active: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', UserSchema);