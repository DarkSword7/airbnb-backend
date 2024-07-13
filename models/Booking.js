import mongoose from "mongoose";
import { Schema } from "mongoose";

const bookingSchema = new Schema({
  place: {
    type: Schema.Types.ObjectId,
    ref: "Place",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    required: true,
  },
  numGuests: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
  },
});

const BookingModel = mongoose.model("Booking", bookingSchema);

export default BookingModel;
