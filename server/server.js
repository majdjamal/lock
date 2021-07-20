
// __author__ = Majd Jamal

'use strict';

const path = require('path'); 
const express = require('express'); 
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');

const port = 8989;
const publicPath = path.join(__dirname);
const app = express();

var jsonParser = bodyParser.json() // Used to decode body content
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const sqlite3 = require('sqlite3').verbose();
let databasen = 'db.sqlite'
let db = new sqlite3.Database(databasen);

const passChecker = (password) => {
	/* Check if the password fulfills the requirements.
	:param password: string, password from user input
	:return: bool, true if password the fulfills requirements.  
	*/
  return (/[a-z]/.test(password) === true && /[0-9]/.test(password) && password.length >= 5) ? true : false;
};

const userIDChecker = (username) => {
	/* Check if username fulfills the requirements.
	:param username: string, username from user input
	:return: bool, true if username the fulfils requirements.  
	*/
	return /^[a-zA-Z0-9 ]*$/.test(username) ? true : false;
};

function availability (name) {
	/* Look into the database to check if the username is taken.
	:param name: string, the user from user input
	:return: bool, true if the name is taken
	*/
	 return new Promise( resolve => {
		
		const quer = 'SELECT namn FROM profil WHERE namn=?';

    db.all(quer, [name], (err, rows) => {
      if (err) {
        throw err;
      }
      if (rows.length > 0) {

        resolve(true);
      } else {
      	resolve(false);
      }
    })
  });}

const signin = async function(name, pass) {
	/* Check if user input is correct, i.e.
	if name and password matches with the database information.
	:param name: string, username from user input
	:param pass: string, password from user input
	:return: bool, true if user input is correct.
	*/
	return new Promise( resolve => {
	const quer = 'SELECT * FROM profil WHERE namn=?';

    db.all(quer, [name], (err, rows) => {
      if (err) {
        throw err;
      }
      try {
	      if (rows[0].password === pass) {
	        resolve(true)
	      }
	      else{
	      	resolve(false)
	      }
	  } catch {
	  	resolve(false)
	  }
	})})
  }

const add = (namn, pass) => {
	/* Register user to the database
	:param name: string, username from user input
	:param pass: string, password from user input
	:return: bool, true if successfully registered. 
	*/
  const quer = 'INSERT INTO profil(namn, password) VALUES(?, ?)';

  db.run(quer, [namn, pass], (err) => {
    if (err) {
      throw err;
    }
  	return true
	});
  	return false
};


let signedUsers = new Map(); // Used to keep track of logged users

app.use(bodyParser.json())

app.use(cookieParser())

app.use(function (req, res, next) {
	/* Assign cookies to new users.
	*/

	let cookie = req.cookies.cookieName;

	if (cookie === undefined){

		let randomNumber = Math.random().toString();
		randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
		next();
	} else {
		next();
	}
	});

app.get('/', (req, res) => {
	/* Send users to home page.
	*/

	res.sendFile(

		path.join(publicPath, '../client/index.html'),

	)});

app.get('/profile', (req, res) => {
	/* Send users to the signed-in page,
	if they are authorized. 
	*/

	let usercookie = req.cookies.cookieName;

	let user = signedUsers.get(usercookie)

	console.log(user)

	if (user){
		res.sendFile(
			path.join(publicPath, '../client/signed.html'),
		)
		}
		else{
			res.redirect('/');
		}
	});

app.post('/signout', (req, res) => {
	/* Remove user from signed in sessions and redirect
	them to the home page.
	*/

	let cookie = req.cookies.cookieName;
	signedUsers.delete(cookie);

	res.sendFile(

		path.join(publicPath, '../client/index.html'),

	)});

app.post('/authentication', urlencodedParser,  (req, res) => {
	/* Authenticate users to allow them to visit the signed-in page,
	i.e. /profile. 
	Also, it registers the user to the database.
	*/

	let name = req.body.userID.toLowerCase()
	let pass = req.body.pass
	let button = req.body.button

	if (button === "Register"){

		if (userIDChecker(name) === false){
			res.redirect('/?error=101');
		}
		else if (passChecker(pass) === false){
			res.redirect('/?error=102');
		} 
		else{

			availability(name)
			.then( bool => {
				if (bool){
					res.redirect('/?error=104');
				} else {
					add(name, pass)
					res.redirect('/?success=1')
				}
			})
		}}

	else if (button === "Login"){

		signin(name,pass)
		.then( bool => {
		if (bool){
			let cookie = req.cookies.cookieName;
			signedUsers.set(cookie, name);
			res.redirect('/profile');
		}
		else {
			res.redirect('/?error=103');
		}
		})}
});

app.listen(port);

console.info(`Listening on port ${port}!`);
