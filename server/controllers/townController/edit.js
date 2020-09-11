
const validateInput = require('./helpers/validateInput');
const cleanParams = require('./helpers/cleanParams');
const {
    sequelize,
    Shantytown: ShantyTowns,
} = require('#db/models');

function toBool(int) {
    if (int === 1) {
        return true;
    }

    if (int === 0) {
        return false;
    }

    return null;
}

module.exports = models => async (req, res) => {
    const permission = req.user.permissions.shantytown.update;

    // check errors
    let fieldErrors = {};
    try {
        fieldErrors = await validateInput(models, req.body, req.user, permission);
    } catch (error) {
        return res.status(500).send({ error });
    }

    if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).send({
            error: {
                developer_message: 'The submitted data contains errors',
                user_message: 'Certaines données sont invalides',
                fields: fieldErrors,
            },
        });
    }

    // check if the town exists
    const town = await ShantyTowns.findOne({
        where: {
            shantytown_id: req.params.id,
        },
    });

    if (town === null) {
        return res.status(400).send({
            error: {
                developer_message: `Tried to update unknown town of id #${req.params.id}`,
                user_message: `Le site d'identifiant ${req.params.id} n'existe pas : mise à jour impossible`,
            },
        });
    }

    // edit the town
    const {
        priority,
        name,
        declaredAt,
        builtAt,
        status,
        closedAt,
        address,
        citycode,
        latitude,
        longitude,
        addressDetails,
        censusStatus,
        censusConductedAt,
        censusConductedBy,
        populationTotal,
        populationCouples,
        populationMinors,
        electricityType,
        electricityComments,
        accessToSanitary,
        sanitaryComments,
        accessToWater,
        waterComments,
        trashEvacuation,
        fieldType,
        ownerType,
        owner,
        socialOrigins,
        ownerComplaint,
        justiceProcedure,
        justiceRendered,
        justiceRenderedBy,
        justiceRenderedAt,
        justiceChallenged,
        policeStatus,
        policeRequestedAt,
        policeGrantedAt,
        bailiff,
    } = cleanParams(req.body);

    try {
        await sequelize.transaction(async () => {
            const baseTown = {
                name,
                priority,
                declaredAt,
                builtAt,
                status,
                closedAt,
                latitude,
                longitude,
                address,
                addressDetails,
                censusStatus,
                censusConductedAt,
                censusConductedBy,
                populationTotal,
                populationCouples,
                populationMinors,
                electricityType,
                electricityComments,
                accessToSanitary: toBool(accessToSanitary),
                sanitaryComments,
                accessToWater: toBool(accessToWater),
                waterComments,
                trashEvacuation: toBool(trashEvacuation),
                fieldType,
                ownerType,
                owner,
                city: citycode,
                updatedBy: req.user.id,
            };

            console.log('before update');

            await town.update(
                Object.assign(
                    {},
                    baseTown,
                    permission.data_justice === true
                        ? {
                            ownerComplaint: toBool(ownerComplaint),
                            justiceProcedure: toBool(justiceProcedure),
                            justiceRendered: toBool(justiceRendered),
                            justiceRenderedBy,
                            justiceRenderedAt,
                            justiceChallenged: toBool(justiceChallenged),
                            policeStatus,
                            policeRequestedAt,
                            policeGrantedAt,
                            bailiff,
                        }
                        : {
                            ownerComplaint: town.ownerComplaint,
                            justiceProcedure: town.justiceProcedure,
                            justiceRendered: town.justiceRendered,
                            justiceRenderedBy: town.justiceRenderedBy,
                            justiceRenderedAt: town.justiceRenderedAt,
                            justiceChallenged: town.justiceChallenged,
                            policeStatus: town.policeStatus,
                            policeRequestedAt: town.policeRequestedAt,
                            policeGrantedAt: town.policeGrantedAt,
                            bailiff: town.bailiff,
                        },
                ),
            );

            if (populationTotal > 10) {
                await town.setSocialOrigins(socialOrigins);
            }
        });

        return res.status(200).send(town);
    } catch (e) {
        return res.status(500).send({
            error: {
                developer_message: e.message,
                user_message: 'Une erreur est survenue dans l\'enregistrement du site en base de données',
            },
        });
    }
};
