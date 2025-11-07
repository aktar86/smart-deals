const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

//4ZMRcctaQk7zeRwM
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
    // get specific all products
    app.get("/products", async (req, res) => {
      // const projectFields = { title: 1, price_min: 1, price_max: 1 };
      // const cursor = productsCollection
      //   .find()
      //   .sort({ price_min: -1 })
      //   .skip(4)
      //   .limit(2)
      //   .project(projectFields);

      //my products
      console.log(req.query);
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Latest Product
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
