import {app, server }from './server.js'
import connection from './database.js'

connection()

server.listen(app.get('port'),()=>{
    console.log(`Server ok on http://localhost:${app.get('port')}`);
})
