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
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const coursesRouter = require('./Routes/Course-Router');
const usersRouter = require('./Routes/Users-Router');

const app = express();
const url = process.env.MONGO_URL;

// ================= Middleware =================
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use('/uploads', express.static('uploads'));

// ================= DB =================
mongoose.connect(url)
  .then(() => console.log('MongoDB started'))
  .catch(err => console.log('MongoDB connection error:', err));

// ================= Routes =================
app.use('/api/courses', coursesRouter);
app.use('/api/users', usersRouter);

// ================= Server =================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
