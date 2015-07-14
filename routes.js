module.exports = function(app) {
    // 主页
    app.get('/', function(req, res) {
        res.render('index', {
            title : '主页'
        });
    });

    // 音频播放器
    app.get('/audio', function(req, res) {
        res.render('audio', {
            title : '最美清唱 FM'
        });
    });

    // 角色编辑器
    app.get('/role_editor', function(req, res) {
        res.render('role_editor', {
            title : '角色编辑器'
        });
    });
}
