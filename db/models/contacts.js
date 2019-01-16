module.exports = function (sequelize, DataTypes) {
    const Contact = sequelize.define('Contact', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'contact_id',
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        operator: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'operators',
                key: 'operator_id',
            },
            field: 'fk_operator',
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
        tableName: 'contacts',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    Contact.associate = (models) => {
        Contact.belongsTo(models.Operator, { foreignKey: 'fk_operator' });
        Contact.belongsToMany(models.Action, {
            through: models.ActionContact,
            foreignKey: 'fk_contact',
        });
    };

    return Contact;
};
