import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

import { Knex } from 'knex';

const knexConfig: { [key: string]: Knex.Config } = {
    development: {
        client: "mysql",
        connection: {
            database: process.env.MYSQL_DATABASE,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
        },
        pool: { min: 2, max: 10 },
    },
    staging: {
        client: "mysql",
        connection: {
            database: process.env.MYSQL_DATABASE,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
        },
        pool: { min: 2, max: 10 },
    },
    production: {
        client: "mysql",
        connection: {
            database: process.env.MYSQL_DATABASE,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
        },
        pool: { min: 2, max: 10 },
    }
};

export default knexConfig;
