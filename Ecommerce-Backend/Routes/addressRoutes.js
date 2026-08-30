const express=require("express")

const router=express.Router()

const auth=require("../MiddleWare/authMiddleware")

const{

addAddress,

getAddresses,

updateAddress,

deleteAddress

}=require("../Controller/addressController")

router.post("/address",auth,addAddress)

router.get("/address",auth,getAddresses)

router.put("/address/:id",auth,updateAddress)

router.delete("/address/:id",auth,deleteAddress)

module.exports=router