const express = require('express');
const app = express();
const dotenv = require('dotenv');
const methodOverride = require('method-override')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')

app.use(express.json());
app.use(express.urlencoded({ extended : false }));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(methodOverride('_method'))
app.use(session({secret : "password", resave : true, saveUninitialized : false}))
app.use(passport.initialize())
app.use(passport.session())

dotenv.config();

const MongoClient = require('mongodb').MongoClient;
const mongoURI = process.env.MONGO_DB_PATH;
// const passwordSession = process.env.SESSION_PASSWORD;

var db;
MongoClient.connect(mongoURI, function(err, client){

    if(err) return console.log(err);

    db = client.db('todoapp');

    app.listen(8080, function(){
        console.log('listening on 8080')
    });


})

app.get('/', function(req,res){
     res.render('index.ejs')
});

app.get('/write', function(req,res){
    res.render('write.ejs')
});

app.post('/add', function(req,res){
    // res.send('전송완료')

    let a = req.body.title;
    let b = req.body.date;

    db.collection('counter').findOne({name : '게시물갯수'}, function(error, result){
        console.log(result.totalPost);
        var totalPost = result.totalPost;
        db.collection('post').insertOne({_id : totalPost + 1, 제목:a, 날짜:b}, function(error, result){
            console.log('저장완료');
            res.redirect('/list')    
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

app.delete('/delete', function(req, res){

    req.body._id = parseInt(req.body._id);

    db.collection('post').deleteOne(req.body, function(error, result){
        console.log('삭제 완료')
        res.status(200).send({message : '성공'});

    })

});

app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(error,result){
        console.log(result);
        if(result == null){
            res.status(404).send('<h1>페이지 없음</h1>')
        }else{
            res.render('detail.ejs', {data : result});
        }
    })
    
})

app.get('/edit/:id', (req, res) => {

    db.collection('post').findOne({_id: parseInt(req.params.id)}, (err, result) => {
        console.log(req.params.id)
        res.render('edit.ejs', {post : result})
    })
    
})

app.put('/edit', (req, res) => {
    const {id, title, date} = req.body;
    console.log(req.body)
    db.collection('post').updateOne({_id : parseInt(id)}, 
    { $set : {제목 : title, 날짜: date}}, 
    (err,result) => {
        console.log('수정 완료')
        res.redirect('/list')
    })
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}),(req, res) => {
    res.redirect('/')
})

app.get('/mypage', isLogin, (req, res) => {
    res.render('mypage.ejs', {user: req.user})
})

function isLogin(req, res, cb){
    if(req.user){
        cb()
    }else{
        res.send('로그인 안함')
    }
}









passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, (inputId, inputPw, done) => {
    //console.log(inputId, inputPw)
    db.collection('login').findOne({id: inputId}, (error, result) => {
        if(error) return done(error)
        if(!result) return done(null, false, {message : '존재하지 않는 ID'})
        if(inputPw == result.pw){
            return done(null, result)
        }else{
            return done(null, false, {message: '비번 틀림'})
        }
    })
}))

passport.serializeUser((user, done) => {
    done(null, user.id)
})
passport.deserializeUser((userId, done) => {
    db.collection('login').findOne({id : userId}, (error, result) => {
        done(null, result)
    })
})