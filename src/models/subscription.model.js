import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
	subscriber: {
		type: mongoose.Schema.Types.ObjectId,//one who is subscribes the channel
		ref:"User",
	},
	channel: {
		type: mongoose.Schema.Types.ObjectId, //one whom channle is subscribed
		ref:"User",
	}
},{timestamps:true});
export const Subscription = mongoose.model("Subscription", subscriptionSchema);