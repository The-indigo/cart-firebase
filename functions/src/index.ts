import * as functions from "firebase-functions";
import * as express from "express";
import {addCustomer} from "./customer";
import {addVendor} from "./vendor";
import {addItem} from "./item";
import {addToCart} from "./cart";
import {db} from "./config/firebase";
import axios from "axios";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
// import {PubSub} from "@google-cloud/pubsub"

dotenv.config();

const app = express();


app.get("/", (req, res) => res.status(200).send("Enutrof"));
app.post("/customer", addCustomer);
app.post("/vendor", addVendor);
app.post("/item/:vendorId", addItem);
app.post("/cart", addToCart);

// async function publishMessage(messageConfig:any) {
//   try {
//       const pubSubClient = new PubSub()

//       const topicName = messageConfig.topicName;
//       const pubSubPayload = messageConfig.pubSubPayload;

//       let dataBuffer = Buffer.from(JSON.stringify(pubSubPayload));
//       await pubSubClient.topic(topicName).publish(dataBuffer);

//   } catch (error) {
//       throw error;
//   }
// }

exports.pay = functions.https.onCall(async (data) => {
  const custCartItems: FirebaseFirestore.DocumentData[] = [];
  try {
    const user = db.collection("customer").doc(data.customerId);

    const userData = await user.get();
    if (!userData.exists) {
      return {error: "Customer with this id does not exist"};
    } else {
      const cartItems = await db.collection("cart")
          .where("ids.customerId", "==", userData.data()?.id).get();
      if (cartItems.empty) {
        return "No matching documents";
      }
      cartItems.forEach((doc) => custCartItems.push(doc.data()));
      // sum up the total amount in the custCartItems array
      const totalAmount = await custCartItems.map(
          (e) => e.itemDetails.itemOrderTotal)
          .reduce((prev, next) => prev + next);
      return {totalAmount: totalAmount, email: userData.data()?.email};
    }
  } catch (error) {
    throw new functions.https.HttpsError("invalid-argument", error);
  }
});
// let orderDone:any;
exports.payTotal = functions.https.onCall(async (data) => {
  const user = db.collection("customer").doc(data.customerId);

  const userData = await user.get();
  if (!userData.exists) {
    return {error: "Customer with this id does not exist"};
  } else {
    const reqData = {
      email: userData.data()?.email,
      amount: data.amount,
    };
    const customerCartItems: FirebaseFirestore.DocumentData[] = [];

    try {
      const response = await axios(
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


      // get the cart items of the customer
      const cartItems = await db.collection("cart")
          .where("ids.customerId", "==", userData.data()?.id).get();

      cartItems.forEach((doc) => customerCartItems.push(doc.data()));

      const cartitemDetails = customerCartItems.map((e) => ({
        itemId: e.itemDetails.itemId,
        itemOrderQuantity: e.itemDetails.itemQuantity,
        itemPrice: e.itemDetails.itemPrice,
        itemOrderTotal: e.itemDetails.itemOrderTotal,
        vendorId: e.itemDetails.itemVendor,

      }));
      if (response.status == 200) {
        const transaction = db.collection("transactions")
            .doc();
        const transactionObject = {
          id: transaction.id,
          ids: {
            customerId: userData.data()?.id,
          },
          item: cartitemDetails,
        };
        const savedtransaction = await transaction.set(transactionObject);
        if (savedtransaction) {
          const transactionItems = await db.collection("transactions")
              .doc(transactionObject.id).get();
          const trans = transactionItems.data();
          const order = db.collection("order");
          const transactionItemArray = transactionItems.data()?.item;

          const batch = db.batch();
          transactionItemArray.forEach((item: any) => {
            const docRef = order.doc();
            const orderObject = {
              id: docRef.id,
              ids: {
                customerId: trans?.ids.customerId,
                vendorId: item.vendorId,
                itemId: item.itemId,
                transactionId: trans?.id,
                itemOrderQuantity: item.itemOrderQuantity,
                itemOrderTotal: item.itemOrderTotal,
              },
            };
            batch.set(docRef, orderObject);
          });

          await batch.commit();

          return {
            status: "successfull",
          };
        }
      } else {
        return {
          status: "Failed",
        };
      }
    } catch (error) {
      throw new functions.https.HttpsError("invalid-argument", error);
    }
  }
});


// exports.notificaion = functions.firestore.document("order/{id}")
//     .onCreate(async (snapshot) => {
//       const orderData= snapshot.data();
//       const vendorId=await orderData.ids.vendorId;
//       if (vendorId) {
//         const payload={notification: {
//           title: "You have a new order",
//           body: "You have a new Order. Click to open your dashboard",
//         },
//         };
//         return admin.messaging().sendToTopic("orders",
//             payload).then((response)=>{
//           console.log("Notification sent successfully:", response);
//         }).catch((e)=>{
//           console.log("Notification sending failed", e);
//         });
//       }
//     });

exports.app = functions.https.onRequest(app);


