const express = require('express');
const mongo = require('mongodb').MongoClient;

// DB URL
const url = 'TODO: Add your DB url';


// Hosting domain
const domain = 'http://example.com/';

// set the port of application
// process.env.PORT lets the port be set by Heroku
const port = process.env.PORT || 3000;

// Creating server
let app = express();

/******************************************
 * 
 * Helper functions
 * 
 ******************************************/

// Returns a random number to be used as shortlink. Number is checked against
// existng short links.
function urlExtensionGenerator(callback) {
    mongo.connect(url, function(err, client) {
        if (!err) {
            console.log('Connected to DB');
        } else {
            console.log('Cannot connect to DB');
        }

        // Connecting to DB (REQUIRED FOR MONGO 3.x)
        let db = client.db('short_url_fcc');

        // Generates a random number for shortlink
        let randomNum = Math.trunc(Math.random() * 812209);

        db.collection('shortLinks').find({}).toArray(function(err, res) {
            let shortLinks = [];

            // Retrieving just the shortlinks from array.
            for (let i = 0; i < res.length; i++) {
                shortLinks.push(Number(res[i]['shortLink']));
            }

            // Checks generated random number against existing shortlinks
            // If conflicts, regenerates until rand not found in shortlinks
            if (shortLinks.includes(randomNum)) {
                while (shortLinks.includes(randomNum)) {
                    randomNum = Math.trunc(Math.random() * 812209);
                }
            // If random number not in shortlinks already, passes to callback
            } else {
                callback(null, randomNum);
                db.close;
            }
        });
    });
}

/******************************************
 * 
 * ROUTES
 * 
 ******************************************/

// Route to generate a short URL
app.get('/add/*', function(req, res) {
    let userURL = req.params[0];

    let error = {'error': 'Invalid URL format'};

    // URL validation
    let httpCheck = userURL.slice(0, 7);
    let httpsCheck = userURL.slice(0, 8);
    
    // Ensuring correct URL format
    if (httpCheck.localeCompare('http://') != 0 && httpsCheck.localeCompare('https://') != 0) {
        res.send(error);
    }
    else {
        // Generating a new short URL and adding to DB
        urlExtensionGenerator(function (err, shortLink) {
            mongo.connect(url, function(err, client) {
                if (!err) {
                    console.log('Connected to DB');
                }
                
                // Object to be added to DB
                let newEntry = {
                    'url': userURL,
                    'shortLink': String(shortLink)
                };
    
                // Connecting to DB (REQUIRED FOR MONGO 3.x)
                let db = client.db('short_url_fcc');
            
                // Inserts into DB
                db.collection('shortLinks').insertOne(newEntry);
            
                db.close;
            });

            // Object that will be displayed to user
            let userVis = {
                'url': userURL,
                'shortLink': domain + String(shortLink)
            };

            res.send(userVis);
        });
    }
});

// Redirecting url
app.get('/:short', function(req, res) {
    let short = req.params.short;

    getRedirect(short, function (err, data) {
        if (err) {
            res.send('Invalid shortlink');
        } else {
            res.redirect(data);
        }
    });

    // Getting redirect URL from shortlink
    function getRedirect(shortLink, callback) {
        mongo.connect(url, function(err, client) {
            if (!err) {
                console.log('Connected to DB');
            }

            // Connecting to DB (REQUIRED FOR MONGO 3.x)
            let db = client.db('short_url_fcc');

            // Checking DB for shortlink
            db.collection('shortLinks').find({'shortLink': String(shortLink)}).toArray(function(err, res) {
                if (err) {
                    callback(true, res);
                    db.close;
                }

                // If not found, returns err as true. Otherwise, returns data
                if  (res.length != 1) {
                    callback(true, res);
                    db.close;
                } else {
                    callback(null, res[0]['url']);
                    db.close;
                }
            });
        
        });
    }
});


/******************************************
 * 
 * Starting server
 * 
 ******************************************/

// Listening on port
app.listen(port);