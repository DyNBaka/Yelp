require('dotenv').config()
const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const Campground = require('./models/campgrounds')
const methodOverride = require('method-override')
const morgan = require('morgan')
const session = require('express-session')
const ejsMate = require('ejs-mate')
const ExpressError = require('./utils/ExpressError')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user')


mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}
)


const db = mongoose.connection
db.on("error", console.error.bind(console, 'connection error'))
db.once("open", () => {
    console.log('Database connected')
})

const campgrounds = require('./routes/campgrounds')
const reviews = require('./routes/reviews')
const users = require('./routes/user')

const app = express()
const port = process.env.PORT

// app.use(morgan('short'))
app.use(methodOverride('_method'))
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(flash())


const sessionConfig = {
    secret: 'thisisasecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


//Routes
app.use('/', users)
app.use('/campgrounds', campgrounds)
app.use('/campgrounds/:id/reviews', reviews)



app.get('/', (req, res) => {
    res.render('home', { home: 'HOME PAGE' })
})




app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err
    if (!err.message) err.message = 'Something went wrong'
    // console.log(err.message)
    res.status(statusCode).render('error', { err })
})


app.listen(port, () => {
    console.log(`LISTENING ON PORT ${port}`)
})
