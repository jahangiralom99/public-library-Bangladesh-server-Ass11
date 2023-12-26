const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");

// middleware
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));
// body parser
app.use(express.json());
// cookies
app.use(cookieParser());



const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e9wqxpd.mongodb.net/?retryWrites=true&w=majority`;

// // Mongo Bd Connections

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //   user Collections
      const allBooksCollection = client.db("libraryBd").collection("allBooks");
      const borrowedDateCollection = client.db("libraryBd").collection("borrowedDate");
      
      await client.connect();

      // crate books or Add Books
      app.post("/api/v1/create-books", async (req, res) => {
          const myBooks = req.body;
          const result = await allBooksCollection.insertOne(myBooks);
          res.send(result);
      });

    //   get ALl app and Filter bt Query and email and pagination 
      app.get("/api/v1/all-books", async (req, res) => {
          //   query by category
          const category = req.query.category;
          let queryObj = {};
          if (category) {
              queryObj.category = category;
          }
          const result = await allBooksCollection.find(queryObj).toArray();
          res.send(result);
      })
    
    
      // categories get for id 
      app.get("/api/v1/all-books/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await allBooksCollection.findOne(query);
        res.send(result);
    });
 

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("welcome my server");
});

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
