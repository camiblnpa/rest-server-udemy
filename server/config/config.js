process.env.PORT = process.env.PORT || 3000;

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

let urlDB;

if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/cafe';
} else {
    urlDB = 'mongodb+srv://camilablnpa:s5hQlhUJYUIXuHJV@cluster0.si3zo.mongodb.net/cafe'
}

process.env.URL_DB = urlDB;