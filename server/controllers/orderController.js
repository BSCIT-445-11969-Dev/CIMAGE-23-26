import Order from "../models/order.js";
import Product from "../models/product.js";
import stripe from "stripe";
import User from "../models/user.js";


//place order COD: /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {

    const { userId, items, address } = req.body;

    if (!userId || !address || !items || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let amount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) continue;

      amount += product.offerPrice * item.quantity;
    }

    // 2% tax
    amount += Math.floor(amount * 0.02);

    await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "COD",
    });

    return res.json({
      success: true,
      message: "Order Placed Successfully"
    });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// place order stripe: /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {

    const { userId, items, address } = req.body;
    const { origin } = req.headers;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let productData = []

    let amount = await items.reduce(async (acc , item)=>{
      const product = await Product.findById(item.product);
      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity
      });
      return (await acc) + product.offerPrice * item.quantity;
    } , 0)

    // 2% tax
    amount += Math.floor(amount * 0.02);

    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "Online",
    });

    //stripe gateway initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    //create line items for stripe
    const line_items = productData.map((item)=>{
      return {
        price_data : {
          currency : "usd",
          product_data : {
            name : item.name
          },
          unit_amount : Math.floor(item.price + item.price * 0.02) * 100
        },
        quantity : item.quantity
      }
    })

    //create session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId,
      }
    })

    return res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//Stripe webhook to verify payment action : /stripe
export const stripeWebhooks = async (req , res) => {

  console.log("🔥 WEBHOOK HIT");


  //stripe gateway initialize
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body, 
      sig , 
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("✅ EVENT TYPE:", event.type);


  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }

  //Handle the event
  switch (event.type) {
  case "checkout.session.completed": {

    const session = event.data.object; // ✅ this is already session

    const { orderId, userId } = session.metadata;

    // ✅ mark order as paid
    await Order.findByIdAndUpdate(orderId, { isPaid: true });

    // ✅ clear cart
    await User.findByIdAndUpdate(userId, { cartItems: {} });

    break;
  }
      case "payment_intent.payment_failed":{
        const paymentIntent = event.data.object;

      const paymentIntentId = paymentIntent.id;

      //Gettin session metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { orderId } = session.data[0].metadata;
      await Order.findByIdAndDelete(orderId);
      break;

      }
      
  
    default:
      console.error(`Unhandled event type ${event.type}`);
      break;
  }
  res.json({ received: true });

}



//Get Orders by user Id : /api/order/user
export const getUserOrders = async (req ,res) =>{
    try {
        const userId = req.userId;
        const orders = await Order.find({
            userId,
            $or: [{paymentType: "COD"} , {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success: true , orders})
    } catch (error) {
        return res.json({success: false , message: error.message});
    }
}

//All order data (for seller / admin) : /api/order/seller
export const getAllOrders = async (req ,res) =>{
    try {
        const orders = await Order.find({
            $or: [{paymentType: "COD"} , {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success: true , orders})
    } catch (error) {
        return res.json({success: false , message: error.message});
    }
}

