const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const Usuario = sequelize.define(
    'Usuario',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        nome: {
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        email: {
            type: DataTypes.STRING(120),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },

        senha: {
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        perfil: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'usuario',
            validate: {
                isIn: [
                    ['admin', 'usuario']
                ]
            }
        }
    },
    {
        tableName: 'usuarios',
        timestamps: false
    }
);

module.exports = Usuario;


