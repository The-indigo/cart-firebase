import {Response} from "express";
import * as admin from "firebase-admin";
import {db} from "./config/firebase";


type Request = {
  body: {
    itemQuantity: number,
    customerId: string,
    itemId: string,
    cartId: string
  },
}


export const removeFromCart = async (req: Request, res: Response):
  Promise<Response> => {
  const {customerId, cartId} = req.body;
  const customer = db.collection("customer").doc(customerId);
  const cart = db.collection("cart").doc(cartId);
  try {
    if (!customer) {
      return res.status(401).json({
        status: "failed",
        message: "Customer not found",
      });
    }
    if (!cart) {
      return res.status(401).json({
        status: "failed",
        message: "Cart item not found",
      });
    }
    const cartData = (await cart.get()).data() || {};
    if (cartData.ids.customerId !== customerId) {
      return res.status(401).json({
        status: "failed",
        message: "You are not the owner of this cart item.",
      });
    }
    const itemInCart = db.collection("item").
        doc(cartData.itemDetails.itemId);
    await itemInCart.update({
      availableQuantity: admin.firestore.
          FieldValue.increment(cartData.itemDetails.itemQuantity),
    });
    await db.collection("cart").doc(cartId).delete();
    return res.status(200).json({
      status: "success",
      message: "Delete successful",
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
// add items to cart by a customer
export const addToCart = async (req: Request, res: Response):
Promise<Response> => {
  const {itemQuantity, customerId, itemId} = req.body;

  if (!itemQuantity) {
    return res.status(401).json({
      status: "failed",
      message: "Item quantity is required",
    });
  }
  try {
    const customer = db.collection("customer").doc(customerId);
    if (!customer) {
      return res.status(401).json({
        status: "failed",
        message: "Customer not found",
      });
    }
    const item = db.collection("item").doc(itemId);
    if (!item) {
      return res.status(401).json({
        status: "failed",
        message: "Item not available",
      });
    }
    const customerData = (await customer.get()).data() || {};
    const itemData = (await item.get()).data() || {};
    if (itemData.availableQuantity < itemQuantity) {
      return res.status(401).json({
        status: "failed",
        message: `Exceeded the available item quantity. 
        There are onlt ${itemData.availableQuantity} items left`,
      });
    }
    const cart = db.collection("cart").doc();
    const price = itemData.price;
    const cartObject = {
      id: cart.id,
      ids: {
        customerId: customerData.id,
      },
      itemDetails: {
        itemId: itemData.id,
        itemQuantity: itemQuantity,
        itemPrice: price,
        itemOrderTotal: itemQuantity * price,
        itemVendor: itemData.vendorid,
      },
    };

    await cart.set(cartObject);
    await item.update({
      availableQuantity: admin.firestore.
          FieldValue.increment(-itemQuantity),
    });
    return res.status(200).json({
      status: "success",
      message: "Added successfully to cart",
      data: cartObject,
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
