var fs = require('fs');
var root_path=process.argv[2];
var w_file='../public/json/music.json';

function getAllFiles(root){
    var res = [] , files = fs.readdirSync(root);
    files.forEach(function(file){
        var pathname = root+'/'+file,
            stat = fs.lstatSync(pathname);

        if (!stat.isDirectory()){
            var name = pathname.replace(root_path + '/',''),
                path = '"/media/music/mp3/' + name + '"';
                str = '{"name":"'+ name +'","src":' + path + '}';
            res.push(str);
        }else {
            res = res.concat(getAllFiles(pathname));
        }
    });
    return res
}

var w_content = '[' + getAllFiles(root_path).join(',') + ']';
fs.readFile(w_file,function(err , data){
    if(err && err.errno==33){
        fs.open(w_file,"w",0666,function(e,fd){
            if(e) throw e;
            fs.write(fd,w_content,0,'utf8',function(e){
                if(e) throw e;
                fs.closeSync(fd);
            })
        });
    } else{
        fs.writeFile(w_file, w_content, function(err){
            if(err)
                console.error('err:' + err);
            console.log('Written!');
        });
    }
})
