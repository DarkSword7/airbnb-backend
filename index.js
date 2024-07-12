import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import download from "image-downloader";
import jwt from "jsonwebtoken";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import User from "./models/User.js";
import Place from "./models/Place.js";
import Booking from "./models/Booking.js";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
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
          res.cookie("token", token).json(user);
        }
      );
    } else {
      res.status(401).json("Invalid credentials");
    }
  } else {
    res.status(404).json("User not found");
  }
});
//get user profile
app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.status(401).json("Unauthorized");
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("Logged out");
});
//upload image to server
app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  await download.image({
    url: link,
    dest: __dirname + "/uploads/" + newName,
  });
  res.json(newName);
});

const photosMiddleware = multer({ dest: "uploads/" });
//upload multiple images to server
app.post("/upload", photosMiddleware.array("photos", 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const extension = parts[parts.length - 1];
    const newPath = path + "." + extension;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace("uploads\\", ""));
  }
  res.json(uploadedFiles);
});
//add new place to database
app.post("/add-place", (req, res) => {
  const { token } = req.cookies;
  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
    if (err) throw err;
    const place = await Place.create({
      owner: userData.id,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    });
    res.json(place);
  });
});
//get all places from database
app.get("/places", async (req, res) => {
  const places = await Place.find();
  res.json(places);
});

// get all places from database with owner id
app.get("/user-places", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
    const { id } = userData;
    const places = await Place.find({ owner: id });
    res.json(places);
  });
});
//show place by id
app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  const placeById = await Place.findById(id);
  res.json(placeById);
});

//update place by id
app.put("/places", (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
    if (err) throw err;
    const place = await Place.findById(id);

    if (userData.id === place.owner.toString()) {
      place.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await place.save();
      res.json("Place updated");
    }
  });
});

app.post("/booking", (req, res) => {
  const { place, checkIn, checkOut, numGuests, name, phone, price } = req.body;
  Booking.create({
    place,
    checkIn,
    checkOut,
    numGuests,
    name,
    phone,
    price,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});
//hJ38ntZRxdncbh9F
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
