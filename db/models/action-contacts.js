module.exports = function (sequelize, DataTypes) {
    const ActionContact = sequelize.define('ActionContact', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'action_contact_id',
        },
        action: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'action',
                key: 'action_id',
            },
            field: 'fk_action',
        },
        contact: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'contacts',
                key: 'contact_id',
            },
            field: 'fk_contact',
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW,
            field: 'updated_at',
        },
    }, {
        tableName: 'action_contacts',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    return ActionContact;
};
