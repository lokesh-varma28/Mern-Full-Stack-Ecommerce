const { createClient } =
require("redis")

const redisClient =
createClient({

    url:process.env.REDIS_URL,

    socket:{

        reconnectStrategy:(retries)=>{

            console.log(

                `Redis reconnect attempt: ${retries}`
            )

            return Math.min(
                retries * 100,
                3000
            )
        },

        connectTimeout:10000
    }
})

redisClient.on("error",(err)=>{

    console.log("Redis error:",err)
})


redisClient.on("reconnecting",()=>{

    console.log("Redis reconnecting...")
})

const connectRedis = async()=>{

    try{

        await redisClient.connect()

        console.log("Connected to Redis")

    }catch(error){

        console.log(

            "Redis connection failed",

            error
        )
    }
}

module.exports = {

    redisClient,

    connectRedis
}