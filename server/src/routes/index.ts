import express, { Request, Response, NextFunction } from 'express';
import knex from '../db/knex';
import signupRouter from './signup';
import signinRouter from './signin';
import logoutRouter from './logout';
import baseurl from './baseurl';

const router: express.Router = express.Router();

router.get('/', async (req: Request, res: Response, _: NextFunction) => {
    if (req.isAuthenticated()) {
        const userId: number = (req.user as any).id;
        knex('tasks')
            .select("*")
            .where({ user_id: userId })
            .then((results) => {
                res.render('index', {
                    title: 'ToDo App',
                    todos: results,
                    isAuth: true,
                    baseurl: baseurl,
                });
            })
            .catch((err) => {
                console.error(err);
                res.render('index', {
                    title: 'ToDo App',
                    isAuth: true,
                    errorMessage: [err.sqlMessage],
                    baseurl: baseurl,
                });
            });
    } else {
        res.render('index', {
            title: 'ToDo App',
            isAuth: false,
            baseurl: baseurl,
        });
    }
});

router.post('/', async (req: Request, res: Response, _: NextFunction) => {
    if (req.isAuthenticated()) {
        //const userId: number = (req as Express.AuthenticatedRequest).user.id;
        const userId: number = (req.user as any).id;
        const todo: string = req.body.add;

        knex("tasks")
            .insert({ user_id: userId, content: todo })
            .then(() => {
                res.redirect(`${baseurl}/`);
            })
            .catch((err) => {
                console.error(err);
                res.render('index', {
                    title: 'ToDo App',
                    isAuth: true,
                    errorMessage: [err.sqlMessage],
                    baseurl: baseurl,
                });
            })
    }
});

router.use('/signup', signupRouter);
router.use('/signin', signinRouter);
router.use('/logout', logoutRouter);

export { router as indexRouter };