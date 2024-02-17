const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
var jwt = require("jsonwebtoken");

// middleware
// http://localhost:5175
// https://public-library-bd.netlify.app
app.use(
  cors({
    origin: ["https://public-library-bd.netlify.app"],
    credentials: true,
  })
);
// body parser
app.use(express.json());
// cookies
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e9wqxpd.mongodb.net/?retryWrites=true&w=majority`;

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
    const borrowedBookCollection = client
      .db("libraryBd")
      .collection("borrowedBook");

    await client.connect();

    // jwt token Create :
    app.post("/api/v1/create-jwt-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none"
        })
        .send({ message: true });
    });

    //My cookies middleware & verify Token
    const getMan = async (req, res, next) => {
      const token = req.cookies.token;

      // console.log(token);
      // if Client does not send token
      if (!token) {
        return res.status(401).send({ message: "UnAuthorized" });
      }

      // verify token
      jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "UnAuthorized" });
        }
        req.user = decoded;
        next();
      });
    };

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

      // quantity sort by
      // http://localhost:3000?sortField=qunatity&sortOrder=ace/dese
      let sortObj = {};
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      // for Sort bt Pric
      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder;
      }

      const result = await allBooksCollection
        .find(queryObj)
        .sort(sortObj)
        .toArray();
      res.send(result);
    });

    // update Books for id
    app.patch("/api/v1/update-books/:id", async (req, res) => {
      const id = req.params.id;
      const myBook = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateBook = {
        $set: {
          image: myBook.image,
          rating: myBook.rating,
          name: myBook.name,
          quantity: myBook.quantity,
          author_name: myBook.author_name,
          category: myBook.category,
          short_description: myBook.short_description,
        },
      };
      const result = await allBooksCollection.updateOne(filter, updateBook);
      res.send(result);
    });

    // categories get for id
    app.get("/api/v1/all-books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allBooksCollection.findOne(query);
      res.send(result);
    });

    // update Books Quantity
    app.put("/api/v1/quantity-update/:id", async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const setQuantity = {
        $set: {
          quantity: update.quantity,
        },
      };
      const result = await allBooksCollection.updateOne(
        filter,
        setQuantity,
        option
      );
      res.send(result);
    });

    //  create borrowed Date collection
    app.post("/api/v1/create-borrowed-books", async (req, res) => {
      const myBorrowedBooks = req.body;
      const result = await borrowedBookCollection.insertOne(myBorrowedBooks);
      res.send(result);
    });

    // get by query email
    app.get("/api/v1/borrowed-books", getMan, async (req, res) => {
      // query by email
      const userEmail = req.query.userEmail;
      const cookiesEmail = req.user.userEmail;

      // console.log(userEmail, cookiesEmail);
      // check this user Email and Token Email/ Cookies Email.
      if (userEmail !== cookiesEmail) {
        return res.status(403).send({ message: "forbidden user" });
      }

      let queryObj = {};
      if (userEmail) {
        queryObj.userEmail = userEmail;
      }
      const result = await borrowedBookCollection.find(queryObj).toArray();
      res.send(result);
    });

    // delate Borrowed Books
    app.delete("/api/v1/delete-book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowedBookCollection.deleteOne(query);
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
