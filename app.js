const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");

const databasePath = path.join(__dirname, "userData.db");

app.use(express.json());
app.use(cors());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(process.env.PORT || 3001, () =>
      console.log("Server Running at http://localhost:3001/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const {
    username,
    password,
    gender,
    location,
    education,
    phoneNumber,
  } = request.body;
  console.log(request.body);
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM activity WHERE username = '${username}';`;
  const result = await database.get(selectUserQuery);
  console.log(
    username,
    password,
    gender,
    location,
    education,
    phoneNumber,
    result
  );

  if (result === undefined) {
    const createUserQuery = `
     INSERT INTO
      activity (username, location, password, phoneNumber,gender,education)
     VALUES
      (
       '${username}',
       '${location}',
       '${hashedPassword}',
       '${phoneNumber}',
       '${gender}',
       '${education}'  
      );`;
    await database.run(createUserQuery);
    response.status(200);
    response.send({ success_msg: "User Created Successfully" });
  } else {
    response.status(400);
    response.send({ error_msg: "User Already Exists" });
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM activity WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);
  console.log(username, password, databaseUser);
  if (databaseUser === undefined) {
    response.status(400);
    response.send({ error_msg: "Invalid UserName" });
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      const payload = { username: username };
      const token = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.status(200);
      response.send({ username });
    } else {
      response.status(400);
      response.send({ error_msg: "Invalid Password" });
    }
  }
});

app.put("/forgotPassword", async (request, response) => {
  console.log("ravi");
  const { username, password } = request.body;
  console.log(request.body, username, password);
  if (username === "") {
    response.status(400);
    response.send({ status: "Please Provide Username" });
  } else {
    const selectUserQuery = `SELECT * FROM activity WHERE username = '${username}';`;
    const databaseUser = await database.get(selectUserQuery);
    if (databaseUser === undefined) {
      response.status(400);
      response.send({ status: "Invalid user" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `update
       activity set password="${hashedPassword}"
        where username="${username}";`;
      const result = await database.run(query);
      response.status(200);
      response.send({ status: "Success" });
    }
  }
});

app.get("/get", async (request, response) => {
  const query = `select * from activity;`;
  const data = await database.all(query);
  response.status(200);
  response.send(data);
});

module.exports = app;
