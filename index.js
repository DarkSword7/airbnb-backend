import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);

const PORT = process.env.PORT || 3000;

await mongoose.connect(process.env.MONGO_URL);

app.get("/", (req, res) => {
  res.send("Hello World");
});

//register new user and save to database
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, 10),
    });

    res.json(user);
  } catch (error) {
    res.status(422).json(error);
  }
});
//login user and check if user exists in database
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (passwordMatch) {
      jwt.sign(
        { email: user.email, id: user._id },
        process.env.JWT_SECRET,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json("User logged in");
        }
      );
    } else {
      res.status(401).json("Invalid credentials");
    }
  } else {
    res.status(404).json("User not found");
  }
});
//hJ38ntZRxdncbh9F
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
