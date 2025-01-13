import createError from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { indexRouter } from './routes/index';
import logger from 'morgan';
import exsession from './config/session';
import passport from './config/passport';
import flash from 'connect-flash';
import basepath from './util/basepath';
import cors from 'cors';
import csurf from './sec/csurf';

const app = express();

console.log(`-- current mode is ${process.env.NODE_ENV} --`);
console.log('-- current Base URL is ' + basepath.rooturl);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

exsession(app);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

csurf(app);

// global ejs template variables
app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.application_name = process.env.APP_NAME || 'App';
    res.locals.rootpath = basepath.rootpath;
    res.locals.hpurl = basepath.hpurl;
    res.locals.org_name = process.env.ORG_NAME || '';
    res.locals.org_year = process.env.ORG_YEAR || '';
    res.locals.org_logourl = process.env.ORG_LOGO_URL || '';
    res.locals.isAuth = req.isAuthenticated();
    next();
});

// router
app.use('/', indexRouter);

// debug
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = ['http://localhost:3001', 'http://example.com']; // 許可するドメイン
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // クッキーの送信を許可
}));

// catch 404 and forward to error handler
app.use((_: Request, __: Response, next: NextFunction) => {
    next(createError(404));
});

// error handler
app.use((err: createError.HttpError, req: Request, res: Response, _: NextFunction) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('./include/error');
});

export default app;