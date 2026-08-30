const Address = require("../Model/addressModel")

// ADD ADDRESS

const addAddress = async(req,res)=>{

    try{

        const userId = req.user.userId

        const address = await Address.create({

            user:userId,

            ...req.body

        })

        res.status(201).json({

            success:true,

            address

        })

    }

    catch(err){

        res.status(500).json({

            message:err.message

        })

    }

}



// GET ALL ADDRESSES

const getAddresses = async(req,res)=>{

    try{

        const addresses = await Address.find({

            user:req.user.userId

        })

        res.json(addresses)

    }

    catch(err){

        res.status(500).json({

            message:err.message

        })

    }

}



// UPDATE ADDRESS

const updateAddress = async(req,res)=>{

    try{

        const address = await Address.findOneAndUpdate(

            {

                _id:req.params.id,

                user:req.user.userId

            },

            req.body,

            {

                new:true

            }

        )

        res.json(address)

    }

    catch(err){

        res.status(500).json({

            message:err.message

        })

    }

}



// DELETE ADDRESS

const deleteAddress = async(req,res)=>{

    try{

        await Address.findOneAndDelete({

            _id:req.params.id,

            user:req.user.userId

        })

        res.json({

            message:"Address Deleted"

        })

    }

    catch(err){

        res.status(500).json({

            message:err.message

        })

    }

}

module.exports={

    addAddress,

    getAddresses,

    updateAddress,

    deleteAddress

}