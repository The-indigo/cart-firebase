import {Response} from "express";
import * as admin from "firebase-admin";
import {db} from "./config/firebase";

type itemType = {
    name: string,
    price: number,
    vendorId: string,
}

type Request = {
    body: itemType,
    params: { vendorId: string }
}
// function to add items to the db and update the
// vendor collection to add the item to the list
// of the vendor's item field
export const addItem = async (req: Request, res: Response) => {
  const {name, price} = req.body;
  const id = req.params.vendorId;
  try {
    const vendor = db.collection("vendor").doc(id);
    const vendorData= (await vendor.get()).data() || {};
    const item = db.collection("item").doc();
    if (vendor) {
      const itemObject = {
        id: item.id,
        name: name,
        price: price,
        vendorId: vendorData.id,
      };
      await item.set(itemObject);
      await vendor.update({
        items: admin.firestore.FieldValue.arrayUnion(item.id)});
      res.status(200).json({
        status: "success",
        message: "Item added succesfully",
        data: itemObject,
      });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};
