// import { Command } from 'commander';
// import inquirer from 'inquirer';
// import fs from 'fs';
// const program = new Command();
// inquirer
//     .prompt([
//         {
//             type: 'input',
//             name: "name",
//             message: "what is your name",
//         },
//         {
//             type: 'input',
//             Country: "Country",
//             message: "what is your Country",
//         },
//     ])
//     .then((answers) => {
//         console.log(answers)
//         if (fs.existsSync('./courses.json')) {
//             fs.readFile('./courses.json', 'utf8', (err, fileContent) => {
//                 if (err) {
//                     console.log('Error', err)
//                     process.exit()
//                 }
//                 console.log('fileContent', fileContent)
//                 const fileContentJson = JSON.parse(fileContent)
//                 fileContentJson.push(answers)
//                 fs.writeFile('./courses.json', JSON.stringify(fileContentJson), 'utf8', () => {
//                     console.log("file has been created")
//                 })
//             })
//         } else {
//             fs.writeFile('./courses.json', JSON.stringify([answers]), 'utf8', () => {
//                 console.log("file has been created")
//             })
//         }
//     })
//////////////////////////////////////npm i//////////////////////////////////////////

/////////////////////////////////////CURD App////////////////////////////////////////

require('dotenv').config();
const express = require('express')
const app = express();
const mongoose = require('mongoose');
const url = process.env.MONGO_URL;
const cors = require('cors'); //عشان يسمح للفرونت انو يتصل بالباك اند

app.use(express.static('/uploads',express.static('uploads')))

mongoose.connect(url).then(() => {
    console.log('mongoos started');
    })
app.use(express.json());
app.use(cors())
const coursesRouter = require('./Routes/Course-Router')
const usersRouter = require('./Routes/Users-Router')
app.use('/api/courses', coursesRouter)
app.use('/api/users', usersRouter)
app.listen(process.env.PORT || 4000, () => {
    console.log("localhost:4000")
})