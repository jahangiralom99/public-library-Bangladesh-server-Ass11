const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
var jwt = require('jsonwebtoken');


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
      const borrowedBookCollection = client.db("libraryBd").collection("borrowedBook");
      
    await client.connect();
    
    // jwt token Create :
    app.post("/api/v1/create-jwt-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: "1h" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "none"
      })
        .send({ message: true });
    });

    //My cookies middleware & verify Token 
    const getMan = async (req, res, next) => {
      const token = req.cookies.token;

      // if Client does not send token
      if (!token) {
        return res.status(401).send({ message: "UnAuthorized" });
      };

      // verify token
      jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "UnAuthorized" });
        };
        res.user = decoded;
        next();
      })
    }
    

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
    
    //  create borrowed Date collection
    app.post("/api/v1/create-borrowed-books", async (req, res) => {
      const myBorrowedBooks = req.body;
      const result = await borrowedBookCollection.insertOne(myBorrowedBooks);
      res.send(result);
    })

    // get by query email 
    app.get("/api/v1/borrowed-books",getMan, async (req, res) => {
      // query bt email
      const userEmail = req.query.email;
      const cookeisEmail = req.pa
      let query = {};
      if (userEmail) {
        query.email = userEmail;
      }
      const result = await borrowedBookCollection.find(query).toArray();
      res.send(result);
    })

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
