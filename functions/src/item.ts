import {Response} from "express";
import * as admin from "firebase-admin";
import {db} from "./config/firebase";

type itemType = {
  name: string,
  price: number,
  vendorId: string,
  availableQuantity: number
}

type Request = {
  body: itemType,
  params: { vendorId: string }
}
// function to add items to the db and update the
// vendor collection to add the item to the list
// of the vendor's item field
export const addItem = async (req: Request, res: Response) => {
  const {name, price, availableQuantity} = req.body;
  const id = req.params.vendorId;

  try {
    if (!name) {
      return res.status(401).json({
        status: "failed",
        message: "Item name is required",
      });
    }
    if (!price) {
      return res.status(401).json({
        status: "failed",
        message: "Item price is required",
      });
    }
    if (!availableQuantity) {
      return res.status(401).json({
        status: "failed",
        message: "Item available quantity is required",
      });
    }
    const vendor = db.collection("vendor").doc(id);
    if (!vendor) {
      return res.status(401).json({
        status: "failed",
        message: "vendor not found",
      });
    }

    const vendorData = (await vendor.get()).data() || {};
    const item = db.collection("item").doc();


    const itemObject = {
      id: item.id,
      name: name,
      price: price,
      availableQuantity: availableQuantity,
      vendorId: vendorData.id,
    };
    await item.set(itemObject);
    await vendor.update({
      items: admin.firestore.FieldValue.arrayUnion(item.id),
    });
    res.status(200).json({
      status: "success",
      message: "Item added succesfully",
      data: itemObject,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};
