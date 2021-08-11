const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const mySecret = 'mongodb+srv://jensoni:KvvTNJgUr0LQP0JC@cluster0.9gvk4.mongodb.net/db1?retryWrites=true&w=majority'


mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let userSchema = new mongoose.Schema({
  name: {type: String, required: true, unique: true}
})

let exerciseScheme = new mongoose.Schema({
  username: String,
  date: Date,
  duration: Number,
  description: String
})

let User = mongoose.model("User", userSchema);

let Exercise = mongoose.model("Exercise",exerciseScheme);

const dateConverter = (para1) =>{
          let dateObj = "";
          let arr=[];
          dateObj = para1.toUTCString().substring(0,16);
          arr = dateObj.split(" ");
          arr[0] = arr[0].substring(0, arr[0].length - 1);
          let temp = arr[2];
          arr[2] = arr[1];
          arr[1] = temp;
          let strDate = arr.join(" ");
          return strDate;
}

app.get("/api/users", (req,res)=>{
  let arr=[];
  User.find({})
    .exec((err,data)=>{
      if(!err){
      //console.log(data);
      data.map(e=>{
        let obj = {
          "_id": e._id,
          "username" : e.name
        }
        arr.push(obj)
      })
      res.send(arr)
      }
      else{
        res.send(err)
      }
    })
})

app.post("/api/users", (req,res)=>{
  let username = req.body.username;
  // console.log(userName);
  let newUser = new User({name: username});
  newUser.save((err,data)=>{
    if(!err){
      console.log(data)
      res.json({"username":data.name,"_id":data._id})
    }
    else{
      res.send("Username already taken")
    }
  })
})

app.post("/api/users/:_id/exercises", (req,res)=>{
  const _id = req.params._id
  console.log(_id)

  User.findOne({_id}, (err,data)=>{
    if(!err){
      const username = data.name
      let {date, duration, description} = req.body;
      if(date==""|| date==undefined || date==null){
        date = new Date();
      }
      //date = new Date(date);
      let newExercise = new Exercise({username,date,duration,description})
      newExercise.save((err,data)=>{
        if(!err){
          let strDate = dateConverter(data.date);
          res.json({"_id":_id,"username":data.username,"date":strDate,"duration":data.duration,"description":data.description})
        }
        else{
          res.send(err)
        }
      })
    }
    else{
      console.log("error here")
      res.send(err.message)
    }
  })
})

app.get("/api/users/:_id/logs", (req,res)=>{
  const{from,to,limit}= req.query;
  console.log(req.query);
  let _id = req.params._id;
  let log=[];
  let count=0;
  let username = "";
  User.findOne({_id}, (err,data)=>{
    username = data.name;
  })

  Exercise.find({}).exec((err,data)=>{
    if(!err){
      //console.log(data);
      data.map(e=>{
        if(e.username == username){
          let obj = {
            "description":e.description,
            "duration":e.duration,
            "date": dateConverter(e.date)
          }
          log.push(obj);
          count++;
        }
      })
      if(req.query.from ||  req.query.to){
        let oriFrom = new Date();
        let oriTo = new Date();
        let fromDate = new Date(0);
        let toDate = new Date();

        if(req.query.from){
          fromDate = new Date(req.query.from)
          oriFrom = fromDate;
        }
        if(req.query.to){
          toDate = new Date(req.query.to)
          oriTo = toDate;
        }
        fromDate = fromDate.getTime()
        toDate = toDate.getTime()

        log = log.filter(e=>{
          let eDate = new Date(e.date).getTime()
          return eDate >= fromDate && eDate <= toDate; 
        })

        if(req.query.limit){
          log = log.slice(0,req.query.limit);
        }

        //console.log("behere",oriFrom,oriTo);
        let strFrom = dateConverter(oriFrom);
        let strTo = dateConverter(oriTo); 
 
        //console.log("sikeeee",strFrom,strTo);
        count = log.length;
        console.log({_id,username,"from":strFrom,"to":strTo,count,log})
        res.json({_id,username,"from":strFrom,"to":strTo,count,log})

      }
      else{
      if(req.query.limit){
        log = log.slice(0,req.query.limit);
      }
      //console.log({_id,username,fromDate,toDate,count,log})
      count=log.length;
      res.json({_id,username,count,log});
      }
    }
    else{
      res.send(err)
    }
  })
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
