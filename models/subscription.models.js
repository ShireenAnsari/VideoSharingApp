import mongoose ,{Schema, model} from "mongoose";
const SubscriptionSchema= new Schema({
subscriber:{
    typeof:Schema.Types.ObjectId, //one who is subscribing
    ref:"User"
},
channel:{
    typeof:Schema.Types.ObjectId, //one who is subscriber
    ref:"User"
}

},{timestamps:true})
export const Subscription=mongoose.model('Subscription',SubscriptionSchema
)