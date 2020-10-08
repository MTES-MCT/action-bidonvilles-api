/* eslint-disable newline-per-chained-call */
const { body } = require('express-validator');
const ALLOWED_TYPES = require('#server/config/contact_request_types');

// models
const { sequelize } = require('#db/models');
const organizationCategoryModel = require('#server/models/organizationCategoryModel')(sequelize);
const organizationTypeModel = require('#server/models/organizationTypeModel')(sequelize);
const organizationModel = require('#server/models/organizationModel')(sequelize);
const departementModel = require('#server/models/departementModel')(sequelize);
const userModel = require('#server/models/userModel')(sequelize);

module.exports = [
    body('last_name')
        .trim()
        .notEmpty().withMessage('Vous devez préciser votre nom'),

    body('first_name')
        .trim()
        .notEmpty().withMessage('Vous devez préciser votre prénom'),

    body('email')
        .trim()
        .notEmpty().withMessage('Vous devez préciser votre courriel')
        .isEmail().withMessage('Ce courriel n\'est pas valide')
        .normalizeEmail()
        .if((value, { req }) => req.body.is_actor === true && req.body.request_type.includes('access-request'))
        .custom(async (value, { req }) => {
            let user = null;
            try {
                user = await userModel.findOneByEmail(value);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification de votre courriel');
            }

            if (user !== null) {
                throw new Error('Un utilisateur existe déjà pour ce courriel');
            }

            req.body.user_full = user;
            return true;
        }),

    body('request_type')
        .isArray({ min: 1 }).withMessage('Vous devez préciser la ou les raisons de votre prise de contact')
        .custom((requestTypes) => {
            if (!Array.isArray(requestTypes)) {
                return true;
            }

            const improperValues = requestTypes.filter(type => !ALLOWED_TYPES.includes(type));
            if (improperValues.length > 0) {
                throw new Error('Certaines raisons sélectionnées ne sont pas reconnues');
            }

            return true;
        }),

    body('is_actor')
        .isBoolean().withMessage('Vous devez préciser si vous êtes un acteur de la résorption des bidonvilles'),

    body('organization_category')
        .if((value, { req }) => req.body.is_actor === true && req.body.request_type.includes('access-request'))
        .custom(async (value, { req }) => {
            if (!value) {
                throw new Error('Vous devez préciser votre structure');
            }

            let organizationCategory;
            try {
                organizationCategory = await organizationCategoryModel.findOneById(value);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification de votre structure');
            }

            if (organizationCategory === null) {
                throw new Error('La structure que vous avez sélectionnée n\'existe pas en base de données');
            }

            req.body.organization_category_full = organizationCategory;
            return true;
        }),

    body('organization_type')
        .toInt()
        .if((value, { req }) => req.body.organization_category_full.uid === 'public_establishment')
        .custom(async (value, { req }) => {
            if (!value) {
                throw new Error('Vous devez préciser le type de votre structure');
            }

            let organizationType;
            try {
                organizationType = await organizationTypeModel.findOneById(value);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification de votre type de structure');
            }

            if (organizationType === null) {
                throw new Error('Le type de structure que vous avez sélectionné n\'existe pas en base de données');
            }

            if (organizationType.organization_category !== 'public_establishment') {
                throw new Error('Le type de structure que vous avez sélectionné est invalide');
            }

            req.body.organization_type_full = organizationType;
            return true;
        }),

    body('organization_public')
        .toInt()
        .if((value, { req }) => req.body.organization_type_full !== undefined)
        .custom(async (value, { req }) => {
            if (!value) {
                throw new Error('Vous devez préciser le territoire de rattachement de votre structure');
            }

            let organization;
            try {
                organization = await organizationModel.findOneById(value);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification de votre territoire de rattachement');
            }

            if (organization === null) {
                throw new Error('Le territoire de rattachement que vous avez sélectionné n\'existe pas en base de données');
            }

            if (organization.fk_type !== req.body.organization_type) {
                throw new Error('Le territoire de rattachement que vous avez sélectionné est invalide');
            }

            req.body.organization_full = organization;
            return true;
        }),

    body('territorial_collectivity')
        .if((value, { req }) => req.body.organization_category_full.uid === 'territorial_collectivity')
        .custom(async (value, { req }) => {
            if (!value) {
                throw new Error('Vous devez préciser le nom de votre structure');
            }

            let organization;
            try {
                organization = await organizationModel.findOneByLocation(
                    value.category,
                    value.data.type,
                    value.data.code,
                );
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du nom de votre structure');
            }

            if (organization === null) {
                throw new Error('Le nom de structure que vous avez sélectionné n\'existe pas en base de données');
            }

            if (organization.fk_category !== 'territorial_collectivity') {
                throw new Error('Le nom de structure que vous avez sélectionné est invalide');
            }

            req.body.organization_full = organization;
            return true;
        }),

    body('organization_administration')
        .if((value, { req }) => req.body.organization_category_full.uid === 'administration')
        .custom(async (value, { req }) => {
            if (!value) {
                throw new Error('Vous devez préciser le nom de votre structure');
            }

            let organization;
            try {
                organization = await organizationModel.findOneById(value);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du nom de votre structure');
            }

            if (organization === null) {
                throw new Error('Le nom de structure que vous avez sélectionné n\'existe pas en base de données');
            }

            if (organization.fk_category !== 'administration') {
                throw new Error('Le nom de structure que vous avez sélectionné est invalide');
            }

            req.body.organization_full = organization;
            return true;
        }),

    body('association')
        .if((value, { req }) => req.body.organization_category_full.uid === 'association')
        .custom(async (value, { req }) => {
            if (!value) {
                throw new Error('Vous devez préciser le nom de votre structure');
            }

            if (value === 'Autre') {
                return true;
            }

            let organization;
            try {
                organization = await organizationModel.findAssociationName(value);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du nom de votre structure');
            }

            if (organization === null) {
                throw new Error('Le nom de structure que vous avez sélectionné n\'existe pas en base de données');
            }

            req.body.association_name = organization.name;
            req.body.association_abbreviation = organization.abbreviation;

            return true;
        }),

    body('new_association_name')
        .if((value, { req }) => req.body.organization_category_full.uid === 'association' && req.body.association === 'Autre')
        .trim()
        .custom(async (value) => {
            if (!value) {
                throw new Error('Vous devez préciser le nom complet de votre association');
            }

            let organization;
            try {
                organization = await organizationModel.findAssociationName(value);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du nom de votre structure');
            }

            if (organization !== null) {
                throw new Error('Il existe déjà une association enregistrée sous ce nom');
            }

            return true;
        }),

    body('new_association_abbreviation')
        .if((value, { req }) => req.body.organization_category_full.uid === 'association' && req.body.association === 'Autre')
        .trim(),

    body('departement')
        .if((value, { req }) => req.body.organization_category_full.uid === 'association')
        .custom(async (value, { req }) => {
            if (!value) {
                throw new Error('Vous devez préciser votre territoire de rattachement');
            }

            // check the departement
            let departement;
            try {
                departement = await departementModel.findOne(value);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification de votre département');
            }

            if (departement === null) {
                throw new Error('Le territoire de rattachement que vous avez sélectionné n\'existe pas en base de données');
            }

            // case of an existing association
            if (req.body.association !== 'Autre') {
                let association = null;
                try {
                    association = await organizationModel.findOneAssociation(
                        req.body.association,
                        value,
                    );
                } catch (error) {
                    throw new Error('Une erreur est survenue lors de la vérification de votre territoire de rattachement');
                }

                if (association !== null) {
                    req.body.new_association = false;
                    req.body.organization_full = association;
                } else {
                    req.body.new_association = true;
                    req.body.new_association_name = req.body.association_name;
                    req.body.new_association_abbreviation = req.body.association_abbreviation;
                }

                return true;
            }

            // case of a brand new association
            req.body.new_association = true;
            return true;
        }),

    body('position')
        .if((value, { req }) => req.body.is_actor === true && req.body.request_type.includes('access-request'))
        .trim()
        .notEmpty().withMessage('Vous devez préciser votre fonction au sein de la structure'),

    body('access_request_message')
        .trim()
        .notEmpty().withMessage('Vous devez préciser votre message'),

    body('legal')
        .custom((value) => {
            if (value !== true) {
                throw new Error('Vous devez certifier que ces données personnelles ont été saisies avec votre accord');
            }

            return true;
        }),
];
