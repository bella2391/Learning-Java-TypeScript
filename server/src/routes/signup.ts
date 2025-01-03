import express, { Request, Response, NextFunction } from 'express';
import knex from '../db/knex';
import bcrypt from 'bcrypt';
import baseurl from './baseurl';

const router: express.Router = express.Router();

router.get('/', (req: Request, res: Response, _: NextFunction) => {
    const isAuth = req.isAuthenticated();
    res.render('signup', {
        title: 'Sign up',
        isAuth: isAuth,
    });
});

router.post('/', (req: Request, res: Response, _: NextFunction) => {
    const isAuth: boolean = req.isAuthenticated();
    const username: string = req.body.username;
    const password: string = req.body.password;
    const repassword: string = req.body.repassword;

    knex("users")
        .where({ name: username })
        .select("*")
        .then(async (result) => {
            if (result.length !== 0) {
                res.render("signup", {
                    title: "Sign up",
                    errorMessage: ["このユーザー名はすでに使われています。"],
                    isAuth: isAuth,
                })
            } else if (password == repassword) {
                const hashedPassword: string = await bcrypt.hash(password, 10);

                knex("users")
                    .insert({name: username, password: hashedPassword})
                    .then(() => {
                        res.redirect(`${baseurl}/`);
                    })
                    .catch(() => {
                        res.redirect(`${baseurl}/`);
                    })
                    .catch((err) => {
                        console.error(err);
                        res.render("signup", {
                            title: "Sign up",
                            errorMessage: [err.sqlMessage],
                            isAuth: isAuth,
                        });
                    });
            } else {
                res.render("signup", {
                    title: "Sign up",
                    errorMessage: ["パスワードが一致しません。"],
                    isAuth: isAuth,
                });
            }
        })
        .catch((err) => {
            console.error(err);
            res.render("signup", {
                title: "Sign up",
                errorMessage: [err.sqlMessage],
                isAuth: isAuth,
            })
        })
})

export default router;
