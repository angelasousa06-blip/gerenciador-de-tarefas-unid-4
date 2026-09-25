const { Sequelize } = require('sequelize');

const NOME_BANCO = 'gerenciador_tarefas';
const USUARIO_BANCO = 'root';
const SENHA_BANCO = '';

const sequelize = new Sequelize(
    NOME_BANCO,
    USUARIO_BANCO,
    SENHA_BANCO,
    {
        host: '127.0.0.1',
        port: 3306,
        dialect: 'mariadb',
        logging: false
    }
);

module.exports = sequelize;

