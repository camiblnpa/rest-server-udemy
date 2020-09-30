require('./config/config');
const mongoose = require('mongoose');
const express = require('express');
const colors = require('colors');
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(require('./routes/index'));

mongoose.connect(process.env.URL_DB, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err, res) => {
    if (err) throw err;
    console.log('Base de datos ONLINE'.bold.green);
})

app.listen(process.env.PORT, () => {
    console.log(`Escuchando en el puerto ${process.env.PORT}`);
});