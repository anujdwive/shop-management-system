const { default: mongoose } = require("mongoose");

const practice = async (req, res) => {
  // const user = await User.find({
  //     age:{$gt: 25}
  // })
  // const user = await User.find({
  //     salary:{$gte: 30000}
  // })
  // const user = await User.find({
  //     age:{$lt: 30}
  // })
  // const user = await User.find({
  //     city:{$in: ["Lucknow", "Kanpur", "Delhi"]}
  // })
  // const user = await User.find({
  //     city:{$nin: ["Lucknow", "Kanpur", "Delhi"]}
  // })
  //   const user = await User.find({
  //     $or: [
  //       {
  //         city: { $in: ["Lucknow"] },
  //       },
  //       {
  //         salary: { $gt: 50000 },
  //       },
  //     ],
  //   });
  // Question 7 — $and
  // Users find karo jinki:
  // age >= 25
  // AND
  // salary > 40000
  //   const user = await User.find({
  //     age: { $gte: 25 },
  //     salary: { $gt: 40000 },
  //   });
  // Question 8 — $or + normal condition
  // Users find karo jinki:
  // age >= 25
  // AND
  // (city = "Lucknow" OR city = "Delhi")
  //   const user = await User.find({
  //     $and: [
  //       { age: { $gte: 25 } },
  //       {
  //         $or: [
  //           {
  //             city: "Lucknow",
  //           },
  //           {
  //             city: "Kanpur",
  //           },
  //         ],
  //       },
  //     ],
  //   });
  // Question 9 — $ne
  // Ab:Users find karo jinki role developer nahi hai.
  // const user = await User.find({
  //     role:{$ne:"developer"}
  // })
  // Question 10 — $exists
  // Suppose kuch users ke document me phone field hai aur kuch me nahi hai.
  // Find karo:
  // Saare users jinke document me phone field exist karti hai.
  //   const user = await User.find({
  //     phone: { $exists: true },
  //   });
  // Question 11 — $regex 🔥
  // User ke name field me "rah" kahin bhi present ho:
  // const filter = {};
  // filter.name = {
  //     $regex:"rah",
  //     $options:"i"
  // }
  // const user = await User.find(filter)
  // Question 12 — Search in multiple fields 🔥
  // User search kare aur hume search karna hai:
  // name
  // city
  // role
  // const search = ""
  // const filter = {};
  // if(search){
  //     filter.$or = [
  //         {
  //             name:{
  //                 $regex:search,
  //                 $options:"i"
  //             }
  //         },
  //         {
  //             city:{
  //                 $regex:search,
  //                 $options:"i"
  //             }
  //         },
  //         {
  //             role:{
  //                 $regex:search,
  //                 $options:"i"
  //             }
  //         },
  //     ]
  // }
  // const user = await User.find(filter)
  // // Question 13
  // // Users ko salary ke basis par highest salary se lowest salary order me fetch karo
  // const user = await User.find().sort({salary: -1})
  // Question 14 — Pagination 🔥
  // Ab real backend API wali query.
  // const page = 2;
  // const limit = 10;
  // const skip = (page-1)*limit;
  // const user = await User.find().skip(skip).limit(limit)
  // Question 15 — Pagination + Search 🔥
  // Products ko:
  // name OR category me "phone" search karo
  // case-insensitive
  // price highest → lowest sort karo
  // pagination apply karo
  //   const { search = "phone" } = req.param;
  //   const page = Number(req.param.page) || 1;
  //   const limit = Number(req.param.limit) || 10;
  //   const skip = (page - 1) * limit;
  //   const filter = {};
  //   if (search.trim()) {
  //     filter.$or = [
  //       {
  //         name: {
  //           $regex: search,
  //           $options: "i",
  //         },
  //       },
  //       {
  //         category: {
  //           $regex: search,
  //           $options: "i",
  //         },
  //       },
  //     ];
  //   }
  //   const product = await Product.find(filter)
  //     .sort({ price: -1 })
  //     .skip(skip)
  //     .limit(limit);
  // Question 16 — $inc 🔥
  // Suppose stock document:
  // User ne 20 new units stock me add kiye.
  // MongoDB query likho jo:
  // quantity: 50 → 70
  // kare.

  //   const updateStock = await Stock.updateOne(
  //     { _id: stockId },
  //     {
  //       $inc: { quantity: 20 },
  //     },
  //   );

  // Question 16-Query likho jisse:

  // 100 → 85

  //   const updateStock = await Stock.updateOne(
  //     {
  //       _id: stockId,
  //     },
  //     { $inc: { quantity: -15 } },
  //   );

  // Question 17 — $set

  // Ab maan lo stock document me:

  // {
  //   quantity: 50,
  //   status: "active"
  // }

  // Tumhe status ko:

  // active → inactive

  // karna hai.

  //   const updateStock = await Stock.updateOne(
  //     { _id: stockId },
  //     {
  //       $inc: { quantity: 30 },
  //       $set: { status: "active", lastUpdated: new Date() },
  //     },
  //   );

  //   Question 19 — $push 🔥

  // {
  //   name: "iPhone",
  //   tags: ["mobile", "apple"]
  // }

  // Tumhe ek new tag "electronics" add karna hai.

  //   const product = await Product.updateOne(
  //     { _id: productId },
  //     { $push: { tags: "electronics" } },
  //   );

  // Question 20 — $push with array

  // {
  //   name: "iPhone",
  //   tags: ["mobile", "apple"]
  // }

  // Ek saath 2 tags add karne hain:

  // "electronics"
  // "premium"
  // $push ke saath $each use karo.

  //   const product = await Product.updateOne(
  //     { _id: productId },
  //     { $push: { tags: { $each: ["electronics", "premium"] } } },
  //   );

  // Question 21 — $addToSet 🔥
  // {
  //   tags: ["mobile", "apple"]
  // }

  // Tum "mobile" ko dobara add karna chahte ho, but duplicate nahi chahiye.

  //   const product = await Product.updateOne(
  //     { _id: productId },
  //     { $addToSet: { tags: "mobile" } },
  //   );

  // Question 22 — $pull

  // {
  //   tags: ["mobile", "apple", "electronics"]
  // }

  // Tumhe "apple" ko array se remove karna hai.

  //   const product = await Product.updateOne(
  //     { _id: productId },
  //     { $pull: { tags: "apple" } },
  //   );

  // Question 23 — $pull with condition 🔥

  // {
  //   name: "Laptop",
  //   reviews: [
  //     { user: "Rahul", rating: 2 },
  //     { user: "Amit", rating: 5 },
  //     { user: "Vikas", rating: 1 }
  //   ]
  // }

  // Tumhe saare reviews remove karne hain jinka rating < 3 hai.

  //   const product = await Product.updateOne(
  //     { _id: productId },
  //     { $pull: { reviews: { rating: { $lt: 3 } } } },
  //   );

  // Question 24 — findOneAndUpdate() 🔥

  // {
  //   _id: stockId,
  //   quantity: 50
  // }

  // Tumhe quantity me 20 add karna hai aur updated document bhi return karna hai.

  //   const stock = await Stock.findOneAndUpdate(
  //     { _id: stockId },
  //     { $inc: { quantity: 20 } },
  //     { new: true },
  //   );

  // Question 25 — findByIdAndUpdate()

  // Given:

  // stockId

  // Stock ki quantity me 10 add karo aur updated stock document return karo.
  //   const stock = await Stock.findByIdAndUpdate(
  //     stockId,
  //     { $inc: { quantity: 10 } },
  //     { new: true },
  //   );

  // Question 26 — Delete query

  // Product ko uski ID se delete karo aur deleted document bhi return karo.

  // const product = await Product.findByIdAndDelete(productId)

  // NOTE: insertOne() MongoDB native driver me hota hai; Mongoose me commonly create() / insertMany() use karte hain.
  await Product.create({
    name: "iPhone 17",
    category: "electronics",
    price: 80000,
    stock: 10,
  });

  //   Question 28 — insertMany()

  // Ab multiple products ek saath insert karo.

  await Product.insertMany([
    { name: "Laptop", category: "electronics", price: 60000, stock: 5 },
    { name: "Mouse", category: "electronics", price: 1000, stock: 20 },
    { name: "Keyboard", category: "electronics", price: 2000, stock: 15 },
  ]);

  //   Question 29 — updateMany() 🔥

  // {
  //   category: "electronics",
  //   price: 5000
  // }

  // Task:

  // Saare electronics products ki price me 10% increase karo.

  // await Product.updateMany(
  //   { category: "electronics" },
  //   {
  //     $mul: {
  //       price: 1.1,
  //     },
  //   },
  // );

  //   await Product.create({
  //   name: "Laptop",
  //   category: "electronics",
  //   price: 60000,
  //   stock: 5
  // })

  // await Product.insertMany([
  //   { name: "Mouse", category: "electronics", price: 1000, stock: 20 },
  //   { name: "Keyboard", category: "electronics", price: 2000, stock: 10 },
  //   { name: "Chair", category: "furniture", price: 5000, stock: 8 },
  // ]);

  // await Product.updateOne({name: "mouse"}, {$set:{price:200}})

  // await Product.deleteOne({name:"Keyboard"})

  // await Product.updateOne({_id:productId}, {$inc:{stock:10}})
  // await Product.updateOne({_id:productId}, {$set:{price:7500}}) => {
  //   acknowledged: true,
  //   matchedCount: 1,
  //   modifiedCount: 1,
  //   upsertedCount: 0,
  //   upsertedId: null
  // }
  // const product = await Product.findByIdAndUpdate(
  //   productId,
  //   { $set: { price: 65000 } },
  //   { new: true }
  // );
  // {
  //   _id: "123",
  //   name: "Laptop",
  //   price: 65000,
  //   stock: 5
  // }

  // await Product.updateOne({ _id: productId }, { $inc: { stock: -4 } });

  // await Product.updateOne({name:"Laptop"},{$push:{tags:"Office"}})
  // await Product.updateOne({name:"Laptop"},{$pull:{tags:"computer"}})
  // const deletedProduct = await Product.findByIdAndDelete(productId);

  // let filter = {};
  // filter.name = {
  //   $regex: search.trim(),
  //   $options: "i",
  // };
  // const skip = (page - 1) * limit;
  // await Product.find(filter).sort({ price: 1 }).skip(skip).limit(limit);

  // if (category) {
  //   filter.category = category;
  // }

  // if (minPrice !== undefined || maxPrice !== undefined) {
  //   filter.price = {};
  //   if (minPrice !== undefined) {
  //     filter.price.$gte = Number(minPrice);
  //   }
  //   if (maxPrice !== undefined) {
  //     filter.price.$lte = Number(maxPrice);
  //   }
  // }

  // await Product.find(filter);

  // POPULATE
  // const userSchema = new mongoose.Schema({
  //   name: String,
  //   email: String,
  //   department: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Department",
  //   },
  // });

  // const productSchema = new mongoose.Schema({
  //   name: String,
  //   price: Number,
  //   createdBy: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "User",
  //   },
  // });

  // await Product.find().populate("createdBy", "email name");
  // const products = await Product.find().populate({
  //   path: "createdBy",
  //   select: "name email",
  //   populate: {
  //     path: "department",
  //     select: "name",
  //   },
  // });

  // AGGREGATION
  await Product.aggregate([
    {
      $match: { category: "electronics" },
    },
    {
      $group: {
        _id: "$category",
        totalCount: { $sum: 1 },
        totalPrice: { $sum: "$price" },
      },
    },
  ]);

  await Product.aggregate([
    {
      $match: {
        price: { $gt: 1000 },
      },
    },
    {
      $sort: {
        price: -1,
      },
    },
    {
      $project: {
        _id: 0,
        name: 1,
        price: 1,
      },
    },
  ]);

  const orders = await Order.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
  ]);

  console.log(orders);

  const order = await Order.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
  ]);

  const prCount = await Product.aggregate([
    {
      $match: {
        stock: { $lt: 10 },
      },
    },
    {
      $count: "totalLowStockProducts",
    },
  ]);

  // const prCount = await Product.aggregate([
  //   {
  //     $match: {
  //       stock: { $lt: 10 },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: null, // sabhi ka ak group
  //       totalLowStockProducts: { $sum: 1 },
  //     },
  //   },
  // ]);

  //  const prCount = await Product.countDocuments({
  //   stock: { $lt: 10 }
  // });

  // const productSchema = new mongoose.Schema({
  //   name: String,
  //   category: String,
  //   price: Number,
  // });

  // productSchema.index({ category: 1, price: 1 });

  // const Product = mongoose.model("Product", productSchema);

  // Calculate the total expenses for the user with ID "123" during the previous calendar month.
  // await Transection.aggregate([
  //   {
  //     $match:{
  //       userId:"123",
  //       dateTime:{$lte:("2026-10-01T00:00:00.000Z"), $gte:("2026-09-01T00:00:00.000Z")},
  //       type: "expense"
  //     }
  //   },
  //   {
  //     $group:{
  //       _id:"123",
  //       totalAmount:{$sum:"$amount"}
  //     }
  //   }
  // ])

  // Calculate the total revenue generated from "completed" orders for user "456" during the current year (2026).

  // await Orders.aggregate([
  //   {
  //     $match: {
  //       userId: "456",
  //       status: "completed",
  //       createdAt: {
  //         $gte:  Date("2026-01-01"),
  //         $lte:  Date("2027-01-01"),
  //       },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: "456",
  //       totalRevenue: { $sum: "$totalAmount" },
  //     },
  //   },
  // ]);

  // Har category ke liye total available stock calculate karo. Sirf un products ko include karo jinka stock zero se greater hai.
  await Products.aggregate([
    {
      $match: {
        stock: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: "$category",
        totalStock: { $sum: "$stock" },
      },
    },
  ]);

  // Har category ka average product price calculate karo. Sirf un products ko include karo jinka stock zero se greater hai.
  // await Products.aggregate([
  //   {
  //     $match: {
  //       stock: { $gt: 0 },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: "$category",
  //       averagePrice: { $avg: "$price" },
  //     },
  //   },
  // ]);

  // Har user ka total completed-order revenue calculate karo. Result mein user ka name aur totalRevenue hona chahiye. Jin users ke completed orders nahi hain, unhe result mein include mat karna.

  // await Orders.aggregate([
  //   {
  //     $match: {
  //       status: "completed",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "users",
  //       localField: "userId",
  //       foreignField: "_id",
  //       as: "orderUser",
  //     },
  //   },
  //   {
  //     $unwind: "$orderUser",
  //   },
  //   {
  //     $group: {
  //       _id: "$userId",
  //       name: { $first: "$orderUser.name" },
  //       totalRevenue: { $sum: "$totalAmount" },
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       name: 1,
  //       totalRevenue: 1,
  //     },
  //   },
  // ]);

  await Orders.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: {
          $gte: new Date("2026-01-01"),
          $lt: new Date("2027-01-01"),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        totalRevenue: 1,
      },
    },
    {
      $sort: {
        month: 1,
      },
    },
  ]);
};
