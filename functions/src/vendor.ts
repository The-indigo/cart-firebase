import {Response} from "express";
import {db} from "./config/firebase";

type VendorType={
    name:string,
    email:string,
    // item:Array<string>
}

type Request ={
    body:VendorType,
    params: {vendorId: string}
}
export const addVendor= async (req:Request, res:Response)=>{
  const {name, email}= req.body;
  try {
    const vendor= db.collection("vendor").doc();
    const vendorObject={
      id: vendor.id,
      name: name,
      email: email,
      items: [],
    };
    vendor.set(vendorObject);
    res.status(200).send({status: "success",
      message: "Vendor added succesfully",
      data: vendorObject});
  } catch (error) {
    res.status(500).json(error.message);
  }
};
