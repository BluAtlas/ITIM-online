# Heroku notes

## Hosting Server

Make sure your server is at the root of your git repository
Also make sure everything is committed

1. `heroku create` (then login)
1. `heroku rename {name}`
1. `git commit`
1. `git push heroku master`

to see output of server: `heroku logs`

## Hosting Client on Heroku

1. Must change any references to localhost to the server address in client
1. Make a folder called `public` and put client files inside it
1. add `app.use(express.static('public'))` to express app
