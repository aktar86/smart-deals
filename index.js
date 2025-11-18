const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 4000;

const serviceAccount = require("./smart-deals-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(cors());
app.use(express.json());

const logger = (req, res, next) => {
  console.log("login information");
  next();
};

// firebase token verify middleware
const verifyFireBaseToken = async (req, res, next) => {
  // console.log("Token Verify", req.headers.authorization);

  if (!req.headers.authorization) {
    //do not allow to go
    return res.status(401).send({ message: "unauthorised access" });
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    //do not allow to go
    return res.status(401).send({ message: "unauthorised access" });
  }

  // verify Token here
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    // email set for data validation
    req.token_email = userInfo.email;
    console.log("userInfo", userInfo);
    next();
  } catch {
    return res.status(401).send({ message: "unauthorised access" });
  }
};

// jwt token middleware
const verifyJWTToken = (req, res, next) => {
  console.log("in middleware:", req.headers);
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorised access" });
  }

  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorised access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorised access" });
    }
    console.log("after decoded", decoded);
    req.token_email = decoded.email;
    next();
  });
};

const uri =
  "mongodb+srv://smart-deals:4ZMRcctaQk7zeRwM@first-mongodb-project.ii5tnsm.mongodb.net/?appName=First-MongoDB-Project";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();

    // create database
    const db = client.db("smart_DB");
    const productsCollection = db.collection("products");
    const bidsCollection = db.collection("bids");
    const userCollection = db.collection("users");

    // jwt releted API
    app.post("/getToken", (req, res) => {
      const loggedUser = req.body;
      const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {
        expiresIn: "1hr",
      });
      res.send({ token: token });
    });

    // user APIs here
    app.post("/users", async (req, res) => {
      const newUser = req.body;

      //user check
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        res.send({
          message: "user already exist. do not neet to insert again",
        });
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    });

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Product APIs here
    app.get("/products", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Latest Product api
    app.get("/latest-products", async (req, res) => {
      const cursor = productsCollection
        .find()
        .sort({ created_at: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get specific products
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      // const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne({ _id: id });
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      // const query = { _id: new ObjectId(id) };
      const query = { _id: id };
      const update = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price,
        },
      };
      const options = {};
      const result = await productsCollection.updateOne(query, update, options);
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      // const query = { _id: new ObjectId(id) };
      const query = { _id: id };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    app.get(
      "/products/bids/:productId",
      verifyFireBaseToken,
      async (req, res) => {
        const productId = req.params.productId;
        const query = { product: productId };
        const cursor = bidsCollection.find(query).sort({ bid_price: -1 });
        const result = await cursor.toArray();
        res.send(result);
      }
    );

    // ----------------------------------------JWT Token----------
    // bid related api with jwt token
    app.get("/bids", verifyJWTToken, async (req, res) => {
      // console.log("Headers:", req.headers);
      const email = req.query.email;
      const query = {};

      if (email) {
        query.buyer_email = email;
      }

      //verify user have access to own data
      if (email !== req.token_email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const cursor = bidsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // bid related apis with firebase token
    // app.get("/bids", logger, verifyFireBaseToken, async (req, res) => {
    //   // console.log(req);
    //   const email = req.query.email;
    //   const query = {};
    //   if (email) {
    //     if (email !== req.token_email) {
    //       return res.status(403).send({ message: "forbidden access " });
    //     }
    //     query.buyer_email = email;
    //   }

    //   const cursor = bidsCollection.find(query);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
      res.send(result);
    });

    //bid delete
    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bidsCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("smart server is running");
});

app.listen(port, () => {
  console.log(`smart server is running on: ${port}`);
});

/**
 * i already have a product collections
 * now i need to add bids. where people can bid their own price for a product. I will also have to see what the bids for this products. also i can see my bids to any of the products. i will be able to remove my bids. see statsus of the products i have bit. etc
 *
 *
 * how shouldt store this bit information. what are different options i have what are the different criterias i should think to make the decision.
 *
 * give me 10 fake json data for bids
 * what is primary key?
 * what is foreign key?
 */
