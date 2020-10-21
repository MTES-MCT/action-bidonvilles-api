
const {
    sequelize,
    Shantytown: ShantyTowns,
} = require('#db/models');

module.exports = () => async (req, res) => {
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

    try {
        await sequelize.transaction(async () => {
            const baseTown = {
                name: req.body.name,
                priority: req.body.priority,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                address: req.body.address,
                addressDetails: req.body.detailed_address,
                builtAt: req.body.built_at,
                populationTotal: req.body.population_total,
                populationCouples: req.body.population_couples,
                populationMinors: req.body.population_minors,
                electricityType: req.body.electricity_type,
                electricityComments: req.body.electricity_comments,
                accessToSanitary: req.body.access_to_sanitary,
                sanitaryComments: req.body.sanitary_comments,
                accessToWater: req.body.access_to_water,
                waterComments: req.body.water_comments,
                trashEvacuation: req.body.trash_evacuation,
                fieldType: req.body.field_type,
                ownerType: req.body.owner_type,
                city: req.body.citycode,
                owner: req.body.owner,
                declaredAt: req.body.declared_at,
                censusStatus: req.body.census_status,
                censusConductedAt: req.body.census_conducted_at,
                censusConductedBy: req.body.census_conducted_by,
                updatedBy: req.user.id,
            };

            await town.update(
                Object.assign(
                    {},
                    baseTown,
                    req.user.permissions.shantytown.update.data_justice === true
                        ? {
                            ownerComplaint: req.body.owner_complaint,
                            justiceProcedure: req.body.justice_procedure,
                            justiceRendered: req.body.justice_rendered,
                            justiceRenderedBy: req.body.justice_rendered_by,
                            justiceRenderedAt: req.body.justice_rendered_at,
                            justiceChallenged: req.body.justice_challenged,
                            policeStatus: req.body.police_status,
                            policeRequestedAt: req.body.police_requested_at,
                            policeGrantedAt: req.body.police_granted_at,
                            bailiff: req.body.bailiff,
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

            await town.setSocialOrigins(req.body.social_origins);
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
