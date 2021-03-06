const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
// dotenv
require('dotenv').config()
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w273s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// middleware
app.use(cors());
app.use(express.json());

async function run() {
    try {
        await client.connect();
        const database = client.db('travelManagement');
        const blogCollection = database.collection('blogs');
        const usersCollection = database.collection('users');
        const MyBlog = database.collection('usersBlog');
        const MyCompared = database.collection('userCompare');
        const Reviews = database.collection('reviews');

            // get all blogs
        app.get('/allBlogs', async (req, res) => {
            const query = {};
            const cursor = blogCollection.find(query);
    
            const results = await cursor.toArray();
            
            if(results) {
              res.json(results);
            }
            else {
              res.send([]);
            }
    
          });
                                    
        // GET blogs
        app.get('/blogs', async (req, res) => {
            const query = { isApproved: true };
            const cursor = blogCollection.find(query);
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let blogs;
            const count = await cursor.count();
            if (page){
                blogs = await cursor.skip(page*size).limit(size).toArray();
            }
            else{
                 blogs = await cursor.toArray();
            }
           res.send({
               count,
               blogs
            });
        });

        // Update Blogs
        app.put('/blogs', async (req, res) => {
            const updated = req.body;
    
            const filter = { _id: ObjectId(updated._id) };
    
            let updateDoc = {};
            if(updated.isApproved)
            {
             updated.isApproved = false;
             updateDoc = {
                 $set: {
                     isApproved: false
                 },
             };
            }
    
            else {
                updated.isApproved = true;
                updateDoc = {
                    $set: {
                        isApproved: true
                    },
                };
               }
               const result = await blogCollection.updateOne(filter, updateDoc);
    
               if (result) {
                res.json(updated);
               }
          });


        // DELETE blogs from ManageBlogs
        app.delete('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await blogCollection.deleteOne(query);
            res.json(result);
        });


        // GET Single blog
        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            console.log('getting specific service', id);
            const query = { _id: ObjectId(id) };
            const blog = await blogCollection.findOne(query);
            res.json(blog);
        })

        // POST blog
        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            console.log('hit the blogs post api', blog);
            const result = await blogCollection.insertOne(blog);
            console.log(result);
            res.json(result)
        });

        // GET Reviews
        app.get('/reviews', async (req, res) => {
            const cursor = Reviews.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // POST Review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log('hit the reviews post api', review);
            const result = await Reviews.insertOne(review);
            console.log(result);
            res.json(result)
        });

        // GET usersBlog 
        app.get('/usersBlog', async (req, res) => {
            const cursor = MyBlog.find({});
            const usersBlog = await cursor.toArray();
            res.send(usersBlog);
        });

        // GET all order by email
        app.get("/MyBlogs/:email", (req, res) => {
            console.log(req.params);
            MyBlog
                .find({ email: req.params.email })
                .toArray((err, results) => {
                    res.send(results);
                });
        });

        //DELETE myblog
        app.delete('/MyBlogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await MyBlog.deleteOne(query);
            res.json(result);
        })

        // POST usersBlog
        app.post('/usersBlog', async (req, res) => {
            const order = req.body;
            console.log('hit the post api', order);
            const result = await MyBlog.insertOne(order);
            console.log(result);
            res.json(result)
        });

        // compare
        // GET usersCompare 
        app.get('/userCompare', async (req, res) => {
            const cursor = MyCompared.find({});
            const userCompare = await cursor.toArray();
            res.send(userCompare);
        });

        // GET allCompare by email
        app.get("/MyCompared/:email", (req, res) => {
            console.log(req.params);
            MyCompared
                .find({ email: req.params.email })
                .toArray((err, results) => {
                    res.send(results);
                });
        });

        //DELETE myblog
        app.delete('/MyCompared/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await MyCompared.deleteOne(query);
            res.json(result);
        })

        // POST usersBlog
        app.post('/userCompare', async (req, res) => {
            const compare = req.body;
            console.log('hit the post api', compare);
            const result = await MyCompared.insertOne(compare);
            console.log(result);
            res.json(result)
        });


        // DELETE usersBlog from ManageusersBlog
        app.delete('/usersBlog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await MyBlog.deleteOne(query);
            res.json(result);
        });


        // user and admin part

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            console.log('put', user);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        //Update get
        app.get('/usersBlog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const user = await MyBlog.findOne(query);
            // console.log('load user with id: ', id);
            res.send(user);
        })

        //  update
        app.put("/updateStatus/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };

            MyBlog
                .updateOne(filter, {
                    $set: {
                        status: "Shipped"
                    },
                })
                .then((result) => {
                    res.send(result);
                    console.log(result);
                });

        });

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Network Server is Runnning')
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});