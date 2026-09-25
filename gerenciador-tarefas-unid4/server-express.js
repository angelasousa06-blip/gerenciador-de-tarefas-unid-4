const express = require('express');
const session = require('express-session');
const path = require('node:path');

const sequelize = require('./database/database');
const Tarefa = require('./models/Tarefa');
const Usuario = require('./models/Usuario');

const app = express();
const PORT = 3000;

// Configuração do EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares de leitura do corpo das requisições
app.use(
    express.urlencoded({
        extended: true,
        limit: '20kb'
    })
);

app.use(
    express.json({
        limit: '20kb'
    })
);

// Middleware de sessão
app.use(
    session({
        secret: 'chave_didatica_unidade3',
        resave: false,
        saveUninitialized: false
    })
);

// Arquivos estáticos
app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);

// Middleware de autenticação
function exigirAutenticacao(req, res, next) {
    if (req.session.usuario) {
        return next();
    }

    return res.redirect('/login');
}

// Middleware de autorização
function exigirAdmin(req, res, next) {
    if (
        req.session.usuario &&
        req.session.usuario.perfil === 'admin'
    ) {
        return next();
    }

    return res
        .status(403)
        .send('Acesso negado.');
}

// Criação de usuário inicial para o laboratório
async function criarUsuarioInicial() {
    const totalUsuarios = await Usuario.count();

    if (totalUsuarios === 0) {
        await Usuario.create({
            nome: 'Administrador',
            email: 'admin@ifce.edu.br',
            senha: '123456',
            perfil: 'admin'
        });

        await Usuario.create({
            nome: 'Usuário Comum',
            email: 'usuario@ifce.edu.br',
            senha: '123456',
            perfil: 'usuario'
        });
    }
}

// Tela de login
app.get('/login', (req, res) => {
    res.render('login', {
        tituloPagina: 'Login',
        erro: null
    });
});

// Processamento do login
app.post('/login', async (req, res, next) => {
    try {
        const email =
            typeof req.body.email === 'string'
                ? req.body.email.trim()
                : '';

        const senha =
            typeof req.body.senha === 'string'
                ? req.body.senha.trim()
                : '';

        const usuario = await Usuario.findOne({
            where: { email }
        });

        if (!usuario || usuario.senha !== senha) {
            return res.status(401).render('login', {
                tituloPagina: 'Login',
                erro: 'E-mail ou senha inválidos.'
            });
        }

        req.session.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil
        };

        return res.redirect('/');
    } catch (erro) {
        return next(erro);
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Página principal protegida
app.get('/', exigirAutenticacao, async (req, res, next) => {
    try {
        const tarefas = await Tarefa.findAll({
            order: [['id', 'DESC']]
        });

        res.render('index', {
            tituloPagina: 'Gerenciador de Tarefas',
            tarefas,
            usuario: req.session.usuario
        });
    } catch (erro) {
        return next(erro);
    }
});

// API protegida
app.get('/api/tarefas', exigirAutenticacao, async (req, res, next) => {
    try {
        const tarefas = await Tarefa.findAll({
            order: [['id', 'DESC']]
        });

        res.json(tarefas);
    } catch (erro) {
        return next(erro);
    }
});

// Cadastrar uma nova tarefa
app.post('/tarefas', exigirAutenticacao, async (req, res, next) => {
    try {
        const titulo =
            typeof req.body.titulo === 'string'
                ? req.body.titulo.trim()
                : '';

        const descricao =
            typeof req.body.descricao === 'string'
                ? req.body.descricao.trim()
                : '';

        if (!titulo) {
            return res
                .status(400)
                .send('O título é obrigatório.');
        }

        await Tarefa.create({
            titulo,
            descricao,
            status: 'pendente'
        });

        return res.redirect(303, '/');
    } catch (erro) {
        return next(erro);
    }
});

// Alternar o status entre pendente e concluída
app.post('/tarefas/:id/status', exigirAutenticacao, async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res
                .status(400)
                .send('Identificador inválido.');
        }

        const tarefa = await Tarefa.findByPk(id);

        if (!tarefa) {
            return res
                .status(404)
                .send('Tarefa não encontrada.');
        }

        tarefa.status =
            tarefa.status === 'pendente'
                ? 'concluida'
                : 'pendente';

        await tarefa.save();

        return res.redirect(303, '/');
    } catch (erro) {
        return next(erro);
    }
});

// Excluir uma tarefa: exige autenticação e perfil admin
app.post(
    '/tarefas/:id/excluir',
    exigirAutenticacao,
    exigirAdmin,
    async (req, res, next) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id)) {
                return res
                    .status(400)
                    .send('Identificador inválido.');
            }

            const quantidadeRemovida =
                await Tarefa.destroy({
                    where: { id }
                });
app.get('/vue', exigirAutenticacao, (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'vue-tarefas.html')
    );
});

app.get('/api/tarefas', exigirAutenticacao, async (req, res, next) => {
    try {
        const tarefas = await Tarefa.findAll({
            order: [['id', 'DESC']]
        });

        return res.json(tarefas);
    } catch (erro) {
        return next(erro);
    }
});

app.post('/api/tarefas', exigirAutenticacao, async (req, res, next) => {
    try {
        const titulo =
            typeof req.body.titulo === 'string'
                ? req.body.titulo.trim()
                : '';

        const descricao =
            typeof req.body.descricao === 'string'
                ? req.body.descricao.trim()
                : '';

        if (!titulo) {
            return res.status(400).json({
                erro: 'O título da tarefa é obrigatório.'
            });
        }

        const tarefa = await Tarefa.create({
            titulo,
            descricao,
            status: 'pendente'
        });

        return res.status(201).json(tarefa);
    } catch (erro) {
        return next(erro);
    }
});

app.patch('/api/tarefas/:id/status', exigirAutenticacao, async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'ID inválido.'
            });
        }

        const tarefa = await Tarefa.findByPk(id);

        if (!tarefa) {
            return res.status(404).json({
                erro: 'Tarefa não encontrada.'
            });
        }

        tarefa.status =
            tarefa.status === 'concluida'
                ? 'pendente'
                : 'concluida';

        await tarefa.save();

        return res.json(tarefa);
    } catch (erro) {
        return next(erro);
    }
});

app.delete('/api/tarefas/:id', exigirAutenticacao, exigirAdmin, async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'ID inválido.'
            });
        }

        const tarefa = await Tarefa.findByPk(id);

        if (!tarefa) {
            return res.status(404).json({
                erro: 'Tarefa não encontrada.'
            });
        }

        await tarefa.destroy();

        return res.json({
            mensagem: 'Tarefa excluída com sucesso.'
        });
    } catch (erro) {
        return next(erro);
    }
});



            if (quantidadeRemovida === 0) {
                return res
                    .status(404)
                    .send('Tarefa não encontrada.');
            }

            return res.redirect(303, '/');
        } catch (erro) {
            return next(erro);
        }
    }
);

// Rota inexistente
app.use((req, res) => {
    res
        .status(404)
        .send('Rota não encontrada.');
});

// Middleware de tratamento de erros
app.use((erro, req, res, next) => {
    console.error(erro);

    res
        .status(500)
        .send(
            'Ocorreu um erro interno no servidor.'
        );
});

// Inicialização: primeiro banco, depois servidor HTTP
async function iniciarServidor() {
    await sequelize.authenticate();
    await sequelize.sync();

    await criarUsuarioInicial();

    app.listen(PORT, () => {
        console.log(
            '=========================================='
        );
        console.log(
            'UNIDADE 3 - AUTENTICAÇÃO E ERROS'
        );
        console.log(
            '=========================================='
        );
        console.log(
            `http://localhost:${PORT}`
        );
        console.log(
            'Usuário admin: admin@ifce.edu.br | Senha: 123456'
        );
        console.log(
            'Usuário comum: usuario@ifce.edu.br | Senha: 123456'
        );
    });
}

iniciarServidor().catch(erro => {
    console.error(
        'Não foi possível iniciar a aplicação:',
        erro
    );

    process.exit(1);
});
