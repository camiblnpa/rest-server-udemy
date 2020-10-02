const Usuario = require('../models/usuario');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const usuario = require('../models/usuario');
const client = new OAuth2Client(process.env.CLIENT_ID);
const app = express();

app.post('/login', (req, res) => {
    let body = req.body;

    //busca el usuario que se está loggeando
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                code: 500,
                err
            });
        }

        //verifica que el correo no existe en base de datos
        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                code: 400,
                err: {
                    message: '(Usuario) o contraseña incorrectos'
                }
            });
        }

        //encripta la contraseña encriptada y la compara con la que está guardada en la base de datos
        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                code: 400,
                err: {
                    message: 'Usuario o (contraseña) incorrectos'
                }
            });
        }

        //genera un token con la información del usuario
        let token = jwt.sign({
            usuario: usuarioDB
        }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });

        res.json({
            ok: true,
            usuario: usuarioDB,
            token
        });

    });
});

//Configuraciones de la API de Google SignIn
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID
    });
    //el payload retorna informacion del usuario de google
    const payload = ticket.getPayload();

    //se personaliza retornando la informacion similar al modelo de usuario
    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    }
}

app.post('/google', async (req, res) => {
    //recibimos el token enviado desde el index.html
    let token = req.body.idtoken;

    //el google user es una promesa que verifica el token enviado
    let googleUser = await verify(token)
        .catch(e => {
            return res.status(403).json({
                ok: false,
                err: e
            });
        });

    //validar en la base de datos para crear el usuario de google
    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        };

        //verificar usuario
        if (usuarioDB) {
            //el usuario existe pero no se logeó con google
            if (usuarioDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Debe usar su autenticación normal'
                    }
                });
            } else {
                //si es un usario de google renovar el token
                let token = jwt.sign({
                    usuario: usuarioDB
                }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });

                return res.json({
                    ok: true,
                    usuario: usuarioDB,
                    token
                });
            }
        } else {
            //el usuario no existe en la base de datos
            let usuario = new Usuario();

            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ':)';

            //guardamos los datos del usuario en la base de datos
            usuario.save((err, usuarioDB) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                };

                let token = jwt.sign({
                    usuario: usuarioDB
                }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });

                return res.json({
                    ok: true,
                    usuario: usuarioDB,
                    token
                });
            });
        }
    });
});

module.exports = app;