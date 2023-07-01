const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended : false }));
app.set('view engine', 'ejs');


const MongoClient = require('mongodb').MongoClient;

var db;
MongoClient.connect('mongodb+srv://lms990108:minseop12@cluster0.tryw5ni.mongodb.net/?retryWrites=true&w=majority', function(err, client){

    if(err) return console.log(err);

    db = client.db('todoapp');

    app.listen(8080, function(){
        console.log('listening on 8080')
    });


})

app.get('/', function(req,res){
     res.sendFile(__dirname + '/index.html')
});

app.get('/write', function(req,res){
    res.sendFile(__dirname + '/write.html')
});

app.post('/add', function(req,res){
    res.send('전송완료')

    let a = req.body.title;
    let b = req.body.date;

    db.collection('counter').findOne({name : '게시물갯수'}, function(error, result){
        console.log(result.totalPost);
        var totalPost = result.totalPost;
        db.collection('post').insertOne({_id : totalPost + 1, 제목:a, 날짜:b}, function(error, result){
            console.log('저장완료');

            db.collection('counter').updateOne({name:'게시물갯수'}, { $inc : {totalPost:1}}, function(error, result){
                if(error){return console.log(error)};
            });

        });

    });

    
});

app.get('/list', function(req,res){

    db.collection('post').find().toArray(function(error, result){
        console.log(result);
        res.render('list.ejs', {posts : result});
    });
});