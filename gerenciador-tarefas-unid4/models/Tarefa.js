const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const Tarefa = sequelize.define(
    'Tarefa',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        titulo: {
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        descricao: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ''
        },

        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'pendente',
            validate: {
                isIn: [
                    ['pendente', 'concluida']
                ]
            }
        }
    },
    {
        tableName: 'tarefas',
        timestamps: false
    }
);

module.exports = Tarefa;

