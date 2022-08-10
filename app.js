const express = require('express');
const app = express();
const port = 5500;
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const flash = require('connect-flash');


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
const MigrationModel = require('./models/Migration');


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
        expires: 60000 * 60 * 4
    }
}));
app.use(flash());

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json())



// routes

app.get('/', isAuth, (req, res) => {
    
    res.render('index');
});


app.get('/login', (req, res) => {
    
    res.render('login', {messages: req.flash('info')});
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await UserModel.findOne({email});
    if(!user || user.active === false) return res.redirect('login');
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) return res.redirect('login');

    req.session.isAuth = true;
    req.session.username = user.username;
    console.log(`${user.username} logged in`)
    res.redirect('/'+user.username);
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
    console.log(`New user created "${username}" and is waiting for approval.`)
    
    res.redirect('login');
});




app.get('/dashboard', isAuth, (req, res) => {
    res.render('dashboard');
});

app.post('/logout', (req, res) => {
    console.log(req.session.username + " logged out.");
    req.session.destroy(err => {
        if(err) console.log(err);
        res.redirect('/');
    });
});

app.get('/api/migration/:migration', async (req, res) => {
    const migrationName = req.params.migration;
    const migration = await MigrationModel.findOne({migrationName})

    res.json(migration);
});



app.post('/api/migration/:migration', async (req, res) => {
    const migrationName = req.params.migration;
    console.log(req.body);
    const {discovered, incomplete, skipped, failed, complete, gb} = req.body;
    console.log(`Updating totals for ${migrationName}`);

    await MigrationModel.updateOne({migrationName}, {
        totals: {
            discovered,
            incomplete,
            skipped,
            failed,
            complete,
            gb
        }
    });

    res.send('updated');
});


app.get('/:user', isAuth, async (req, res) => {
    
    const username = req.session.username;
    if(req.params.user !== username ) return res.sendStatus(401);

    let userMigrationNames = await UserModel.findOne({username}, 'migrations');
    let migrations = []
    for (const migrationName of userMigrationNames.migrations){
        migrations.push(await MigrationModel.findOne({migrationName}, ['client', 'name', 'source', 'destination']));
    }

    res.render('user', {migrations: migrations, username: username});
});

app.get('/:user/:migration', isAuth, async (req, res) => {
    
    const username = req.session.username;
    if(req.params.user !== username ) return res.sendStatus(401);

    const migrationName = req.params.migration;
    const migration = await MigrationModel.findOne({migrationName}, ['client', 'name', 'source', 'destination','totals']);


    res.render('migration', {migration: migration, username: username});
});


// APIs


app.listen(process.env.PORT || port, () => {
    console.log(`Listening on port ${port}`);
});