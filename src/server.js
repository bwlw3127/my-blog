import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDb = async (operation, res) => {
    try{
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser:true });
        const db = client.db('full-stack');
        await operation(db);
        client.close();
        
    } catch(error) {
       return res.status(500).json({message: 'connection failed', error});
    }
}

app.get('/api/articles/:name', async (req, res) => {
    withDb(async (db)=>{
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(articleInfo);
    }, res)
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDb(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({ name: articleName}, {
            '$set' : {
                upvotes: articleInfo.upvotes + 1, 
            },
        });
        const newArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(newArticleInfo);
    }, res)
});

app.post('/api/articles/:name/comment' ,(req, res) => {
    withDb(async (db)=>{
        const articleName = req.params.name;
        const userInput = req.body;

        const articleInfo = await db.collection('articles').findOne({ name: articleName});
        await db.collection('articles').updateOne({ name: articleName}, {
            '$set': {
                'comments': articleInfo.comments.concat(userInput),
            },
        })
        const newArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(newArticleInfo);
    }, res)
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})
app.listen(8000, ()=>console.log('listening on port 8000'));