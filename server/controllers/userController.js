const { generateAccessTokenFor, hashPassword, generateSalt } = require('#server/utils/auth');
const { User } = require('#db/models');

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

module.exports = () => ({
    async signin(req, res) {
        const { email, password } = req.body;

        if (typeof email !== 'string') {
            return res.status(400).send({
                success: false,
                error: {
                    user_message: 'L\'adresse e-mail est invalide',
                    developer_message: 'The email address must be a string',
                },
            });
        }

        if (typeof password !== 'string') {
            return res.status(400).send({
                success: false,
                error: {
                    user_message: 'Le mot de passe est invalide',
                    developer_message: 'The password must be a string',
                },
            });
        }

        const user = await User.findOne({
            where: {
                email,
            },
        });

        if (user === null) {
            return res.status(403).send({
                success: false,
                error: {
                    user_message: 'Ces identifiants sont incorrects',
                    developer_message: 'The given credentials do not match an existing user',
                },
            });
        }

        const hashedPassword = hashPassword(password, user.salt);
        if (hashedPassword !== user.password) {
            return res.status(403).send({
                success: false,
                error: {
                    user_message: 'Ces identifiants sont incorrects',
                    developer_message: 'The given credentials do not match an existing user',
                },
            });
        }

        return res.status(200).send({
            success: true,
            token: generateAccessTokenFor(user),
        });
    },

    renewToken(req, res) {
        const { id: userId, email } = req.user;

        return res.status(200).send({
            token: generateAccessTokenFor({ id: userId, email }),
        });
    },

    /**
     * Returns information about... yourself!
     */
    async me(req, res) {
        return res.status(200).send(req.user);
    },

    /**
     * Updates some data about the current user
     */
    async edit(req, res) {
        // find the user
        const { id: userId } = req.user;
        const user = await User.findOne({
            where: {
                id: userId,
            },
        });

        if (user === null) {
            return res.status(500).send({
                error: {
                    user_message: 'Impossible de trouver voos informations en bases de données.',
                    developer_message: `User #${userId} does not exist`,
                },
            });
        }

        // validate the input
        const errors = {};

        // first name
        const firstName = trim(req.body.first_name);
        if (firstName === null || firstName === '') {
            errors.first_name = ['Le prénom est obligatoire '];
        }

        // last name
        const lastName = trim(req.body.last_name);
        if (lastName === null || lastName === '') {
            errors.last_name = ['Le nom de famille est obligatoire '];
        }

        // company
        const company = trim(req.body.company);
        if (company === null || company === '') {
            errors.company = ['Le nom de la structure pour laquelle vous travaillez est obligatoire '];
        }

        // password
        const password = trim(req.body.password);
        if (password !== null && password.length < 10) {
            errors.password = ['Votre mot de passe n\'est pas assez long, il doit contenir au moins 10 caractères'];
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).send({
                error: {
                    developer_message: 'The submitted data contains errors',
                    user_message: 'Certaines données sont invalides',
                    fields: errors,
                },
            });
        }

        // actually update the user
        const data = {
            first_name: firstName,
            last_name: lastName,
            company,
        };

        if (password !== null) {
            data.password = hashPassword(password, user.salt);
        }

        try {
            await user.update(data);
            return res.status(200).send({
                id: user.userId,
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                company,
                departement: user.departement,
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue dans l\'écriture de vos informations en base de données.',
                    developer_message: error.message,
                },
            });
        }
    },

    /**
     *
     */
    async signup(req, res) {
        // limit access to that api to a specific set of users
        const { id: userId } = req.user;
        const user = await User.findOne({
            where: {
                id: userId,
            },
        });

        if (user === null || user.email !== 'anis@beta.gouv.fr') {
            return res.status(400).send({
                error: {
                    user_message: 'Vous n\'avez pas accès à cette fonctionnalité',
                },
            });
        }

        // create the new user
        const {
            email,
            password,
            departement,
            first_name,
            last_name,
            company,
            role,
        } = req.body;

        const salt = generateSalt();

        try {
            await User.create({
                email,
                salt,
                password: hashPassword(password, salt),
                departement,
                first_name,
                last_name,
                company,
                fk_role: role,
            });

            return res.status(200).send();
        } catch (error) {
            return res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue dans l\'enregistrement de l\'utilisateur en base de données',
                    developer_message: error.message,
                },
            });
        }
    },
});
