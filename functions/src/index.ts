import * as functions from "firebase-functions";
import * as express from "express";
import {addCustomer} from "./customer";
import {addVendor} from "./vendor";
import {addItem} from "./item";
import {addToCart} from "./cart";
import {db} from "./config/firebase";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();


app.get("/", (req, res) => res.status(200).send("Enutrof"));
app.post("/customer", addCustomer);
app.post("/vendor", addVendor);
app.post("/item/:vendorId", addItem);
app.post("/cart", addToCart);

exports.pay = functions.https.onCall(async (data) => {
  const retriv: FirebaseFirestore.DocumentData[] = [];
  try {
    const user = db.collection("customer")
        .where("email", "==", data.email);
    const userData = (await user.get()).docs || {};

    const cartItems = await db.collection("cart")
        .where("ids.customerId", "==", userData[0].id).get();
    if (cartItems.empty) {
      return "No matching documents";
    }
    cartItems.forEach((doc) => retriv.push(doc.data()));
    const e = await retriv.map((e) => e.itemDetails.itemOrderTotal)
        .reduce((prev, next) => prev + next);
    return e;
  } catch (error) {
    throw new functions.https.HttpsError("invalid-argument", error);
  }
});

exports.payTotal= functions.https.onCall(async (data)=>{
  // functions.https.onRequest (async (Request,Response)=>{
  const reqData={
    email: data.email,
    amount: data.amount,
  };
  try {
    const response=await axios(
        {
          method: "post",
          url: "https://api.paystack.co/transaction/initialize",
          headers: {
            "Authorization":
          `Bearer ${process.env.SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          data: reqData,
        });
    return response.data;
  } catch (error) {
    throw new functions.https.HttpsError("invalid-argument", error);
  }
});


exports.app = functions.https.onRequest(app);


