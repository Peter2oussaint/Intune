const  express = require('express');
const app = express();
 require('dotenv').config();



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req,res,next)=> {console.log(req.path,req.method); next()})

 app.get("/",(req,res)=>res.json("Hi Sucka"))
app.listen(process.env.PORT, () => {
  console.log('Server listening on port',process.env.PORT );
}); 