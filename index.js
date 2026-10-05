import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
});

let myusername = process.env.name;

console.log("value: ", myusername);


console.log("Start of an awesome backend project");
