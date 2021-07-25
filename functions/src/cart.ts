import {Response} from "express";
import {db} from "./config/firebase";


type Request = {
    body: {
        itemQuantity:number,
        customerId:string,
        itemId:string
     },
}
// add items to cart by a customer
export const addToCart = async (req: Request, res: Response) => {
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
    const item= db.collection("item").doc(itemId);
    if (!item) {
      return res.status(401).json({
        status: "failed",
        message: "Item not available",
      });
    }
    const customerData= (await customer.get()).data() || {};
    const itemData= (await item.get()).data() || {};
    const cart = db.collection("cart").doc();
    const price= itemData.price;
    const cartObject = {
      id: cart.id,
      ids: {
        customerId: customerData.id,
      },
      itemDetails: {
        itemId: itemData.id,
        itemQuantity: itemQuantity,
        itemPrice: price,
        itemOrderTotal: itemQuantity*price,
        itemVendor: itemData.vendorid,
      },
    };

    await cart.set(cartObject);
    return res.status(200).json({
      status: "success",
      message: "Added successfully to cart",
      data: cartObject,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};
