import {Response} from "express";
import {db} from "./config/firebase";

type CustomerType={
    name:string,
    email:string
}

type Request ={
    body:CustomerType,
    params: {customerId: string}
}
export const addCustomer= async (req:Request, res:Response)=>{
  const {name, email}= req.body;
  try {
    const customer=await db.collection("customer").doc();
    const customerObject={
      id: customer.id,
      name: name,
      email: email,
    };
    customer.set(customerObject);
    res.status(200).send({status: "success",
      message: "Customer added succesfully",
      data: customerObject});
  } catch (error) {
    res.status(500).json(error.message);
  }
};
