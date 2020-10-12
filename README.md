H52.5D三维游戏渲染器

### 目标
实现一个类似育碧出品的游戏那种画面感的游戏引擎

曾经玩过一些加拿大游戏公司“育碧”出品的游戏，感觉艺术感特别强，因此以此做为参考做出一个类似的游戏引擎。之前考虑过用webgl的2d引擎Pixi.js去实现类似的游戏，但发现不能做到类似“育碧“最近出的游戏的那中空间透视感，所以还是打算自己写个引擎。

### 功能
1. 简单的角色2d配型, 角色配型采用2d动画，然后置入3d场景中。
2. 画面场景拥有3d透视纵深感，场景为3d游戏场景，角色可自由活动空间中。
3. 支持3d文本，及文本输入。
4. 支持3d元素的空间捕捉和拾取，以及碰撞检测。
7. 支持各种键盘快捷映射操作。
5. 第一视角界面采用webUI界面， 灵活易用。
7. 做了webgl的着色器优化及3d算法的性能优化，跑得更快。

### 目录结构
    
    |__O
        |__renderer.js
        |__animation.js
        |__check.js
        |__class.js
        |__keyborder.js
        |__math.js

* renderer.js --------- 渲染引擎的核心部分
* animation.js -------- 动画控制器
* check.js ------------ 浏览器及设备检测
* class.js ------------ 所有类的祖先类
* keyborder.js -------- 键盘控制器
* math.js ------------- 3D图形算法

### 使用

#### 1. 添加渲染器
    
    // 添加渲染器
    var renderer = new O.Renderer(1440, 768, { transparent: true });
    document.body.appendChild(renderer.view);


#### 1. 添加一个场景容器做为舞台
    
    var senceOutSide = new O.Container();

    // 添加舞台
    var stage = senceOutSide;

#### 1. 添加一个精灵做为角色
    
    // 天加一个动画角色
    var url = 'res/playeranimframe.png',
        width = 150,
        height = 269;

    var player = new O.Sprite(url, function(img) {
        player.point.x = -width * .5;
        player.point.y = height;
    });

    player.start = 1;
    player.end = 1;
    player.width = width;
    player.height = height;
    player.timer = 600;
    player.position.x = 0;
    player.position.y = -300;
    player.position.z = 0;

    // player.color = [255/255, 244/255, 172/255, 1];
    stage.addChild(player);
    

### Documention
该引擎框架名叫”O”
#### 全局方法
* O.createShader
> ...

* O.createShaderFromScript
> ...

* O.getShader
> ...

#### 对象结构
* O.Renderer
> ...

* O.BasicObject
> ...

* O.DisplayObject
> ...

* O.Range
> ...

* O.Container
> ...

* O.Text 
> ...

* O.BorderText
> ...

* O.Sprite
> ...
