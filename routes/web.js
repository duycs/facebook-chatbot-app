module.exports = (app) => {
    var service = require('../services/web');
    var passport = require('passport');
    var Strategy = require('passport-local').Strategy

    passport.serializeUser(function(user, callback) {
      callback(null, user);
    });

    passport.deserializeUser(function(user, callback) {
        callback(null, user);
    });

    passport.use(new Strategy((username, password, done) => {
        if (username == 'admin' && password == 'admin@1234') {
            return done(null, username);
        }
        done(null, false, {message: 'Tên đăng nhập hoặc mật khẩu không đúng!'});
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/', service.home);

    app.get('/logout', (req, res, next) => {
        req.logout();
        res.redirect('/');
    });

    app.post('/', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) return next(err);

            if (!user) {
                return res.render('login', {message: info.message});
            }

            req.logIn(user, (err) => {
                if (err) return next(err);

                res.redirect('/');
            })
        })(req, res, next)
    });
};
