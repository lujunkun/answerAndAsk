const   exp = require('express'),
        bodyParser = require('body-parser'),
        cookieParser = require('cookie-parser'),
        fs = require('fs'),
        multer = require('multer'),
        app = exp()
        
        
const   storage = multer.diskStorage({
            destination: 'www/uploads',
            filename: function(req, file, callback){
                var petname = req.cookies.petname
                callback(null, `${petname}.jpg`)
            }
        }),
        uploads = multer({storage})
        
        
app.use(exp.static('www'))
app.use(bodyParser.urlencoded({extended:true}))
app.use(cookieParser())


/*--------------------注册--------------------*/

app.post('/user/register', (req, res) => {
    req.body.ip = req.ip
    req.body.time = new Date()
 
    function send(code, message){
        res.status(200).json({code, message})
    }
    
    function saveFile(){
        var fileName = `users/${req.body.petname}.txt`
        
        fs.exists(fileName, exists => {
            if(exists){
                send('registered', '用户名已经注册过了！')
            }
            else{
                fs.appendFile(fileName, JSON.stringify(req.body), err => {
                    if(err){
                        send('file error', '抱歉，系统错误...')
                    }
                    else{
                        send('success', '恭喜，注册成功！请登录...')
                    }
                })
            }
        })
    }
   
    fs.exists('users', exists => {
        if(exists){
            saveFile()
        }
        else{
            fs.mkdir('users', err => {
                if(err){
                    send('file error', '抱歉，系统错误...')
                }
                else{
                    saveFile()
                }
            })
        }
    })
})

/*--------------------登录--------------------*/

app.post('/user/signin', (req, res) => {
    var fileName = `users/${req.body.petname}.txt`
    
    function send(code, message){
        res.status(200).json({code, message})
    }
    
    fs.exists(fileName, exists => {
        if(exists){
            fs.readFile(fileName, (err, data) => {
                if(err){
                    send('file error', '抱歉，系统错误...')
                }
                else{
                    var user = JSON.parse(data)
                    if(user.password == req.body.password){
                        
                        res.cookie('petname', req.body.petname)
                        // 此处需要加密
                        
                        send('success', '登录成功...')
                    }
                    else{
                        send('signin error', '用户名或密码错误！')
                    }
                }
            })
        }
        else{
            send('register error', '用户名未注册！')
        }
    })
})

/*--------------------退出--------------------*/

app.get('/user/signout', (req, res) => {
    res.clearCookie('petname')
    res.status(200).json({code: 'success'})
})

/*--------------------提问--------------------*/

app.post('/ask', (req, res) => { 
    var petname = req.cookies.petname
     
    function send(code, message){
        res.status(200).json({code, message})
    }
    
    if(!petname){
        send('signin error', '请重新登录...')
        return
    }
    
    var time = new Date()
    
    req.body.petname = petname
    req.body.ip = req.ip
    req.body.time = time
    
    function saveFile(){
        var fileName = `questions/${time.getTime()}.txt`
        
        fs.appendFile(fileName, JSON.stringify(req.body), err => {
            if(err){
                send('file error', '抱歉，系统错误...')
            }
            else{
                send('success', '问题提交成功！')
            }
        })
    }
    
    fs.exists('questions', exists => {
        if(exists){
            saveFile()
        }
        else{
            fs.mkdir('questions', err => {
                if(err){
                    send('file error', '抱歉，系统错误...')
                }
                else{
                    saveFile()
                }
            })
        }
    })
})

/*--------------------头像--------------------*/

app.post('/user/photo', uploads.single('photo'), (req, res) => {
    res.status(200).json({ code: 'success', message: '上传成功' })
})

/*--------------------首页--------------------*/

app.get('/questions', (req, res) => {
    
    function send(code, message, data){
        res.status(200).json({code, message, data})
    }
    
    function readFiles(i, files, questions, complete){
        if(i < files.length){
            fs.readFile(`questions/${files[i]}`, (err, data) => {
                if(!err){
                    questions.push(JSON.parse(data))
                }
                readFiles(++i, files, questions, complete)
            })
        }
        else{
            complete()
        }
    }
    
    fs.readdir('questions', (err, files) => {
        if(err){
            send('file error', '抱歉，系统错误...')
        }
        else{
            files = files.reverse()
            var questions = []
            
            readFiles(0, files, questions, function(){
                send('success', '读取数据成功！', questions)
            })
        }
    })
})

/*--------------------回答--------------------*/

app.post('/answer', (req, res) => { 
    var petname = req.cookies.petname
     
    function send(code, message){
        res.status(200).json({code, message})
    }
    
    if(!petname){
        send('signin error', '请重新登录...')
        return
    }
    console.log(req.body)
    var filename = `questions/${req.body.question}.txt`
    
    req.body.petname = petname
    req.body.ip = req.ip
    req.body.time = new Date()
    
    fs.readFile(filename, (err, data) => {
        if(err){
            send('file error', '抱歉，系统错误...')
        }
        else{
            var question = JSON.parse(data)
            if(!question.answers) question.answers = []
            
            question.answers.push(req.body)
            
            fs.writeFile(filename, JSON.stringify(question), err => {
                if(err){
                    send('file error', '抱歉，系统错误...')
                }
                else{
                    send('success', '回答提交成功！')
                }
            })
        }
    })
})

/*--------------------监听--------------------*/

app.listen(8000, () => console.log('问答系统正在运行...'))