import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

import passport from 'passport';
import knex from '../db/knex';
import bcrypt from 'bcrypt';
import User from '../models/user';
import baseurl from '../routes/baseurl';

passport.serializeUser((user, done) => {
    if (typeof user !== 'object' || user === null) {
        throw new Error('User must be a non-null object');
    }
    const user_info = user as { id: number; [key: string]: any };
    if (!('id' in user_info) || typeof user_info.id !== 'number') {
        throw new Error('User object does not contain a valid id');
    }
    done(null, user_info.id);
});

passport.deserializeUser(async (id: number, done) => {
    try {
        const user: Express.User = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

import { Strategy as DiscordStrategy, Profile as DiscordProfile } from 'passport-discord';

const discordClientId = process.env.DISCORD_CLIENT_ID || '';
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET || '';
const discordCallbackURL =  getCallBackURL('discord');

if (!discordClientId || !discordClientSecret || !discordCallbackURL) {
    throw new Error('Discord OAuth settings are missing in .env file.');
}

passport.use(new DiscordStrategy({
    clientID: discordClientId,
    clientSecret: discordClientSecret,
    callbackURL: discordCallbackURL,
    scope: ['identify', 'email'] // 'guilds', 'guild.join'
}, async (accessToken, _, profile: DiscordProfile, done) => {
    try {
        const existingUser = await knex('users').where({ discordId: profile.id }).first();
        if (existingUser) {
            return done(null, existingUser);
        }

        const [newUserId] = await knex('users').insert({
            discordId: profile.id,
            name: profile.username,
            email: profile.email,
            avatar: profile.avatar,
            accessToken,
        });

        const newUser = await knex('users').where({ id: newUserId }).first();

        return done(null, newUser)
    } catch (err) {
        console.error('Error in DiscordStrategy: ', err)
        return done(null, false, { message: err });
    }
}));

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleCallbackURL = getCallBackURL('google');

if (!googleClientId || !googleClientSecret || !googleCallbackURL) {
    throw new Error('Google OAuth setting are missing in .env file');
}

passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackURL
}, async (accessToken, _, profile, done) => {
    try {
        const existingUser = await knex('users').where({ googleId: profile.id }).first();
        if (existingUser) {
            return done(null, existingUser);
        }

        const [newUserId] = await knex('users').insert({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0].value,
            avatar: profile.photos?.[0].value,
            accessToken,
        });

        const newUser = await knex('users').where({ id: newUserId }).first();

        return done(null, newUser);
    } catch (err) {
        console.error('Error in GoogleStrategy: ', err)
        return done(err, false);
    }
}));

import { Strategy as XStrategy } from 'passport-twitter';

const xConsumerKey = process.env.X_CONSUMER_KEY || '';
const xConsumerSecret = process.env.X_CONSUMER_SECRET || '';
const xCallbackURL = getCallBackURL("x");

if (!xConsumerKey || !xConsumerSecret || !xCallbackURL) {
    throw new Error('X OAuth settings are missing in .env file.');
}

passport.use('x', new XStrategy({
    consumerKey: xConsumerKey,
    consumerSecret: xConsumerSecret,
    callbackURL: xCallbackURL,
    includeEmail: true,
}, async (token, _, profile, done) => {
    try {
        const existingUser = await knex('users').where({ xId: profile.id }).first();
        if (existingUser) {
            console.log('Existing user found: ', existingUser);
            return done(null, existingUser);
        }

        const [newUserId] = await knex('users').insert({
            xId: profile.id,
            name: profile.displayName,
            xname: profile.username,
            email: profile.emails?.[0].value,
            avatar: profile.photos?.[0].value,
            accessToken: token,
        });

        const newUser = await knex('users').where({ id: newUserId }).first();

        return done(null, newUser);
    } catch (err) {
        console.error('Error in XStrategy: ', err);
        return done(err);
    }
}));

import { Strategy as LocalStrategy } from 'passport-local';

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
}, async (username: string, password: string, done) => {
    try {
        const user = await knex('users').where({ name: username }).first();
        if (!user) {
            return done(null, false, { message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Invalid username or password' });
        }

        return done(null, user);
    } catch (err) {
        console.error('Error in LocalStrategy: ', err);
        return done(err);
    }
}));

export default passport;

function getCallBackURL(type: string): string {
    var callbackurl: string = '';
    if (process.env.NODE_ENV === 'production') {
        if (process.env.IS_HTTPS === 'true') {
            callbackurl += 'https://';
        }
        callbackurl += process.env.PRODUCTION_HOST || 'localhost';
    } else {
        callbackurl += 'http://localhost';
    }

    if (process.env.PORT) {
        callbackurl  += ":" + process.env.PORT;
    }
    callbackurl += `${baseurl}/auth/${type}/callback`

    return callbackurl;
}
