const express = require('express');
const app = express();
const port = 5500;
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');


app.set('view engine', 'ejs')
app.use(express.static('public'));

// db
const mongoURI = process.env.MONGO_URI
const mongoose = require('mongoose');

async function mongooseConnection(URI) {
    try {
        await mongoose.connect(URI);
        console.log("Successful Connection");

    } catch (error) {
        console.error(error);
    }
}
mongooseConnection(mongoURI);

// schemas
const UserModel = require('./models/User');


// sessions
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const store = new MongoDBSession({
    uri: mongoURI,
    collection: "sessions"
});


// middlewares
const isAuth = (req, res, next) => {
    if(req.session.isAuth){
        return next();
    }

    return res.redirect('login');
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        expires: 30000
    }
}));

app.use(bodyParser.urlencoded({extended: true}));



// routes

app.get('/', isAuth, (req, res) => {
    res.render('index');
});


app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await UserModel.findOne({email});
    if(!user || user.active === false) return res.redirect('login');
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) return res.redirect('login');

    req.session.isAuth = true;

    res.redirect('dashboard');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    let user = await UserModel.findOne({email});
    if(user) return res.redirect('register');

    user = new UserModel({
        username,
        email,
        password: await bcrypt.hash(password, 12)
    });
    await user.save();

    res.redirect('login');
});


app.get('/dashboard', isAuth, (req, res) => {
    res.render('dashboard');
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) console.log(err);
        res.redirect('/');
    });
});



app.listen(process.env.PORT || port, () => {
    console.log(`Listening on port ${port}`);
});