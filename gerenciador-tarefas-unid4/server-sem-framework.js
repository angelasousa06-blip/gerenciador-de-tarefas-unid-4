const http =
    require('node:http');

const fs =
    require('node:fs/promises');

const path =
    require('node:path');


// ======================================================
// Configurações
// ======================================================

const PORT = 3000;

const PUBLIC_DIR =
    path.join(__dirname, 'public');


// ======================================================
// "Banco de dados" temporário em memória
// ======================================================

let tarefas = [

    {
        id: 1,
        titulo: 'Estudar rotas',
        descricao:
            'Compreender método HTTP e URL',
        status: 'pendente'
    },

    {
        id: 2,
        titulo: 'Estudar middleware',
        descricao:
            'Compreender o fluxo da requisição',
        status: 'pendente'
    }

];

let proximoId = 3;


// ======================================================
// Função auxiliar para enviar JSON
// ======================================================

function enviarJson(
    res,
    status,
    dados
) {

    res.writeHead(
        status,
        {
            'Content-Type':
                'application/json; charset=utf-8'
        }
    );

    res.end(
        JSON.stringify(dados)
    );

}


// ======================================================
// Ler o corpo da requisição
// ======================================================

async function lerCorpo(req) {

    let corpo = '';

    for await (
        const parte of req
    ) {

        corpo += parte;

        if (
            Buffer.byteLength(corpo)
            > 20 * 1024
        ) {

            throw new Error(
                'PAYLOAD_TOO_LARGE'
            );

        }

    }


    if (!corpo) {

        return {};

    }


    const contentType =
        (
            req.headers[
                'content-type'
            ] || ''
        )
            .split(';')[0]
            .trim();


    // ==================================================
    // JSON
    // ==================================================

    if (
        contentType ===
        'application/json'
    ) {

        try {

            return JSON.parse(corpo);

        } catch {

            throw new Error(
                'INVALID_JSON'
            );

        }

    }


    // ==================================================
    // URL Encoded
    // ==================================================

    if (
        contentType ===
        'application/x-www-form-urlencoded'
    ) {

        return Object.fromEntries(
            new URLSearchParams(corpo)
        );

    }


    throw new Error(
        'UNSUPPORTED_MEDIA_TYPE'
    );

}


// ======================================================
// Validação
// ======================================================

function validarNovaTarefa(dados) {

    if (
        typeof dados.titulo !== 'string'
        ||
        !dados.titulo.trim()
    ) {

        return 'O título é obrigatório.';

    }


    const statusPermitidos = [
        'pendente',
        'concluida'
    ];


    if (
        !statusPermitidos.includes(
            dados.status
        )
    ) {

        return 'Status inválido.';

    }


    return null;

}


// ======================================================
// Arquivos estáticos
// ======================================================

const arquivosEstaticos = {

    '/': {
        arquivo: 'index.html',
        tipo:
            'text/html; charset=utf-8'
    },

    '/index.html': {
        arquivo: 'index.html',
        tipo:
            'text/html; charset=utf-8'
    },

    '/style.css': {
        arquivo: 'style.css',
        tipo:
            'text/css; charset=utf-8'
    },

    '/app.js': {
        arquivo: 'app.js',
        tipo:
            'text/javascript; charset=utf-8'
    }

};


async function servirArquivoEstatico(
    pathname,
    res
) {

    const item =
        arquivosEstaticos[pathname];


    if (!item) {

        return false;

    }


    try {

        const arquivoCompleto =
            path.join(
                PUBLIC_DIR,
                item.arquivo
            );


        const conteudo =
            await fs.readFile(
                arquivoCompleto
            );


        res.writeHead(
            200,
            {
                'Content-Type':
                    item.tipo
            }
        );


        res.end(conteudo);


    } catch (erro) {

        console.error(erro);

        enviarJson(
            res,
            500,
            {
                erro:
                    'Erro ao carregar arquivo.'
            }
        );

    }


    return true;

}


// ======================================================
// Criar servidor HTTP
// ======================================================

const server =
    http.createServer(
        async (req, res) => {

            const url =
                new URL(
                    req.url,
                    `http://${req.headers.host || 'localhost'}`
                );


            const pathname =
                url.pathname;


            console.log(
                `[${new Date().toLocaleString()}]`,
                req.method,
                pathname
            );


            // ==========================================
            // GET /api/tarefas
            // ==========================================

            if (
                req.method === 'GET'
                &&
                pathname === '/api/tarefas'
            ) {

                return enviarJson(
                    res,
                    200,
                    tarefas
                );

            }


            // ==========================================
            // POST /api/tarefas
            // ==========================================

            if (
                req.method === 'POST'
                &&
                pathname === '/api/tarefas'
            ) {

                try {

                    const dados =
                        await lerCorpo(req);


                    const erroValidacao =
                        validarNovaTarefa(
                            dados
                        );


                    if (erroValidacao) {

                        return enviarJson(
                            res,
                            400,
                            {
                                erro:
                                    erroValidacao
                            }
                        );

                    }


                    const novaTarefa = {

                        id: proximoId++,

                        titulo:
                            dados
                                .titulo
                                .trim(),

                        descricao:
                            typeof dados.descricao
                            === 'string'
                                ?
                                dados
                                    .descricao
                                    .trim()
                                :
                                '',

                        status:
                            dados.status

                    };


                    tarefas.push(
                        novaTarefa
                    );


                    return enviarJson(
                        res,
                        201,
                        novaTarefa
                    );


                } catch (erro) {


                    if (
                        erro.message ===
                        'PAYLOAD_TOO_LARGE'
                    ) {

                        return enviarJson(
                            res,
                            413,
                            {
                                erro:
                                    'Corpo da requisição muito grande.'
                            }
                        );

                    }


                    if (
                        erro.message ===
                        'INVALID_JSON'
                    ) {

                        return enviarJson(
                            res,
                            400,
                            {
                                erro:
                                    'JSON inválido.'
                            }
                        );

                    }


                    if (
                        erro.message ===
                        'UNSUPPORTED_MEDIA_TYPE'
                    ) {

                        return enviarJson(
                            res,
                            415,
                            {
                                erro:
                                    'Content-Type não suportado.'
                            }
                        );

                    }


                    console.error(erro);


                    return enviarJson(
                        res,
                        500,
                        {
                            erro:
                                'Erro interno do servidor.'
                        }
                    );

                }

            }


            // ==========================================
            // Rotas com ID
            // /api/tarefas/1
            // ==========================================

            const correspondencia =
                pathname.match(
                    /^\/api\/tarefas\/(\d+)$/
                );


            // ==========================================
            // PATCH /api/tarefas/:id
            // ==========================================

            if (
                req.method === 'PATCH'
                &&
                correspondencia
            ) {

                const id =
                    Number(
                        correspondencia[1]
                    );


                const tarefa =
                    tarefas.find(
                        item =>
                            item.id === id
                    );


                if (!tarefa) {

                    return enviarJson(
                        res,
                        404,
                        {
                            erro:
                                'Tarefa não encontrada.'
                        }
                    );

                }


                try {

                    const dados =
                        await lerCorpo(req);


                    if (
                        dados.status !==
                        'pendente'
                        &&
                        dados.status !==
                        'concluida'
                    ) {

                        return enviarJson(
                            res,
                            400,
                            {
                                erro:
                                    'Status inválido.'
                            }
                        );

                    }


                    tarefa.status =
                        dados.status;


                    return enviarJson(
                        res,
                        200,
                        tarefa
                    );


                } catch (erro) {

                    return enviarJson(
                        res,
                        400,
                        {
                            erro:
                                'Dados inválidos.'
                        }
                    );

                }

            }


            // ==========================================
            // DELETE /api/tarefas/:id
            // ==========================================

            if (
                req.method === 'DELETE'
                &&
                correspondencia
            ) {

                const id =
                    Number(
                        correspondencia[1]
                    );


                const indice =
                    tarefas.findIndex(
                        item =>
                            item.id === id
                    );


                if (indice === -1) {

                    return enviarJson(
                        res,
                        404,
                        {
                            erro:
                                'Tarefa não encontrada.'
                        }
                    );

                }


                tarefas.splice(
                    indice,
                    1
                );


                res.writeHead(204);

                return res.end();

            }


            // ==========================================
            // Arquivos estáticos
            // ==========================================

            if (
                req.method === 'GET'
                &&
                await servirArquivoEstatico(
                    pathname,
                    res
                )
            ) {

                return;

            }


            // ==========================================
            // 404
            // ==========================================

            enviarJson(
                res,
                404,
                {
                    erro:
                        'Rota não encontrada.'
                }
            );

        }
    );


// ======================================================
// Inicialização
// ======================================================

server.listen(
    PORT,
    () => {

        console.log(
            ''
        );

        console.log(
            '=========================================='
        );

        console.log(
            'SERVIDOR SEM FRAMEWORK'
        );

        console.log(
            '=========================================='
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            ''
        );

    }
);