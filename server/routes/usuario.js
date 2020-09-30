const Usuario = require('../models/usuario');
const { verificaToken, verificaAdmin_Role } = require('../middlewares/authentication');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const app = express();

app.get('/usuario', verificaToken, (req, res) => {

    let desde = Number(req.query.desde) || 0;
    let limite = Number(req.query.limite) || 5;

    Usuario.find({ estado: true }, 'nombre email role estado google img')
        .skip(desde)
        .limit(limite)
        .exec((err, usuarios) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    code: 400,
                    err
                });
            }

            Usuario.countDocuments({ estado: true }, (err, conteo) => {
                res.json({
                    ok: true,
                    cantidad: conteo,
                    usuarios
                })
            });
        });
});

app.post('/usuario', [verificaToken, verificaAdmin_Role], (req, res) => {
    let body = req.body; //obtiene la data del body

    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role
    });

    usuario.save((err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                code: 400,
                err
            });
        }

        res.status(201).json({
            ok: true,
            code: 201,
            usuario: usuarioDB
        })
    });
});

app.put('/usuario/:id', [verificaToken, verificaAdmin_Role], (req, res) => {
    let id = req.params.id; //obtiene el id de la url
    let body = _.pick(req.body, ['nombre', 'email', 'img', 'role', 'estado']);

    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                code: 400,
                err
            });
        }

        res.json({ ok: true, usuario: usuarioDB });
    })

});

app.delete('/usuario/:id', [verificaToken, verificaAdmin_Role], (req, res) => {
    let id = req.params.id;

    //eliminación lógica de la base de datos
    Usuario.findByIdAndUpdate(id, { estado: 'false', new: true }, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                code: 400,
                err
            });
        }

        res.json({
            ok: true,
            usuario: usuarioBorrado
        });
    })

    //eliminación física en la base de datos
    // Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
    //     if (err) {
    //         return res.status(400).json({
    //             ok: false,
    //             code: 400,
    //             err
    //         });
    //     }

    //     if (!usuarioBorrado) {
    //         return res.status(400).json({
    //             ok: false,
    //             code: 400,
    //             err: {
    //                 message: 'Usuario no encontrado'
    //             }
    //         });
    //     }

    //     res.json({
    //         ok: true,
    //         usuario: usuarioBorrado
    //     });
    // });
});

module.exports = app;