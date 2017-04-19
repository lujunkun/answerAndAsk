const express = require('express'),
    bodyParser = require('body-parser'),
    fs =require('fs')
const app = express()
app.use(express.static('www'))
app.use(bodyParser.urlencoded({extended:false}))
app.post('/getFile', function(req, res){
    console.log(req.body)
    fs.exists('questions', function(ex){
        if(!ex){
            res.json({result:0, message:'文件夹不存在'})
        } else {

            fs.readdir('questions', function(err, files){
                if(err){
                    res.send('文件系统错误1')
                } else {
                    console.log(files)

                    // for循环之后会得到多个响应，与请求和响应一对一的关系违背
                    //解决方案：最终只返回一个响应，当读完文件后再返回响应信息 
                    function readFiles(i, files, box, complete){
                        var filePath = 'questions/' + files[i]
                        if( i < files.length ){
                            fs.readFile(filePath, function(err, data){
                                if(!err){
                                    box.push(JSON.parse(data))
                                }
                                readFiles(++i, files, box, complete)
                            })
                        } else {
                            complete()
                        }
                    }
                    var box = []
                    files = files.reverse()
                    readFiles(0, files, box, function(){
                        res.json({result:1, message:'获取数据成功', datas:box})
                    })
                }
            })
        }
    })
})
app.listen(2060, function(){
    console.log('file is run')

})