(function(exports) {
    // 调整浏览器窗口大小
    window.resizeTo(1024, 768);

    // 添加渲染器
    var renderer = new O.Renderer(1440, 768, { transparent: true });
    document.body.appendChild(renderer.view);

    // 添加舞台
    var stage = new O.Container();

    // 定义用户序号
    user_num  = 0;

    // 定义场景序号
    sence_num = 0;

    /////////////////////////////////////////////////////////////////////

    var Sence = Class.extend({
        init: function(opts) {
            if (!opts)
                opts = {};

            this._id = ++sence_num;

            if (opts.create) 
                this.create = opts.create;
        }
    });

    // 弹出窗口
    var Popup = Class.extend({
        init: function(opts) {
            if (!opts)
                opts = {};

            this.visible = false;
            this.width = opts.width || 400,
            this.height = typeof opts.height == 'number'? 
                opts.height:(typeof opts.height == "string"? 0:320);

            this.defaultOpts = {
                width: this.width,
                height: this.height,
                arrow: true,
                direction: 'top',
                left: 0,
                top: 0
            }

            this.div = document.createElement('div');
            this.div.className = "dialog none";

            this.settings = opts;
        },
        setOpts: function(opts) {
            for (var o in this.defaultOpts) {
                switch (o) {
                    case 'width':
                    case 'height':
                    case 'left':
                    case 'top':
                        var value = opts[o]? opts[o]:this.defaultOpts[o];
                        if (typeof value == "number")
                            value += 'px';

                        this.div.style[o] = value;
                        break;
                    case 'arrow':
                        if (typeof opts[o] != "boolean") 
                            opts[o] = this.defaultOpts[o]

                        if (opts[o]) {
                            var arrowCls = ['arrow-border', 'arrow'];
                            for (var i=0;i<arrowCls.length;++i) {
                                var div = document.createElement('div');
                                div.className = arrowCls[i];
                                this.div.appendChild(div);
                                div = null;
                            }
                        }
                        break;
                     case 'direction':
                        var cls = opts[o]? opts[o]:this.defaultOpts[o];
                        this.div.className += ' ' + cls;
                        break;
                    default:
                        break;
                }
            }
        },
        show: function() {
            var win_width = window.innerWidth;
            var win_height = window.innerHeight;

            this.defaultOpts.left = (win_width - this.width) * 0.5,
            this.defaultOpts.top  = (win_height - this.height) * 0.5,

            this.setOpts(this.settings);
            document.body.appendChild(this.div);

            this.div.className = this.div
                .className.replace(' none','');

            this.visible = true;
        },
        close: function() {
            document.body.removeChild(this.div);
            this.visible = false;
        }
    });

    // 商品展示窗口
    var ProductWin = Popup.extend({
        init: function(opts) {
            this._super(opts);

            if (!opts)
                opts = {};

            this.data = opts.data || [];

            this.showProducts();
        },
        showProducts: function() {
            for (var i=0;i<this.data.length;++i) {
                var product = this.data[i];
                this.addProduct(product);
            }
        },
        addProduct: function(product) {
            var ctrlTpl = "<ul> \
                            <li>{{ price }}</li> \
                            <li><button>加入购物车 ></button></li> \
                          </ul>";

            var img = new Image
            img.src = product.imgurl;
            var imgBox = document.createElement('div');
            var ctrlArea =  document.createElement('div');
            var item = document.createElement('div');

            ctrlArea.innerHTML = tools.template(ctrlTpl,product);
            imgBox.appendChild(img);
            item.appendChild(imgBox);
            item.appendChild(ctrlArea);
            this.div.appendChild(item);
            img.onload = function() {
                //imgBox.
                this.onload = null;
            };
            img.onerror = function() {
                this.onerror = null;
            }
            imgBox = null;
            ctrlArea = null;
            img = null;
            item = null;
        },
        removeProduct: function() {
        
        }
    });

    // 聊天对话框
    var ChatWin = Popup.extend({
        init: function(opts) {
            this._super(opts);

            if (!opts)
                opts = {};
            
            // 当消息发送时触发,并调用该回调函数
            this.onSendMessage = opts.onSendMessage? opts.onSendMessage:null;
            
            //
            this.editor = document.createElement('div');
            this.editor.setAttribute('contenteditable', true);
            this.div.appendChild(this.editor);

            this.button = document.createElement('button');
            this.button.innerText = "确定";
            this.div.appendChild(this.button);

            var self = this;
            this.button.addEventListener('click', function() {
                var messages = self.editor.innerHTML;

                self.onSendMessage && self.onSendMessage(messages);
            }, false);
        }
    });

    //////////////////////////////////////////////////////////////////////

    // 角色
    var Role = Class.extend({
        init: function(opts) {
            if (!opts)
                opts = {};
            
            // 设置角色id
            this._id = ++user_num;

            this.defaultOpts = {
                isMainView: false,
                headUrl: "res/default-head.png",
                onUp: null
            }

            this.setOpts(opts);

            this.img = null;

            this.sprite = this.create();

            this.stand();

            this.initChatTips();

            var self = this;

            animation.addHandle('tick', function() {
                self.move(360);
            });
        },
        setOpts: function(opts) {
            for (var o in this.defaultOpts) {
                switch (o) {
                    case 'isMainView':
                        if (typeof opts[o] != "boolean")
                            opts[o] = this.defaultOpts[o];

                        if (opts[o]) {
                            var img = new Image();
                            img.src = opts['headUrl'] || this.defaultOpts['headUrl'];

                            this.head = document.createElement('div');
                            this.head.className = "role-head";

                            this.head.onmouseover = function() {

                            }

                            this.head.appendChild(img);

                            document.body.appendChild(this.head);

                            img = null;
                        }
                        break;
                    case 'onUp':
                        opts[o] && (this[o] = opts[o]);
                        break;
                    default:
                        break;
                }
            }
        },
        create: function() {
            var url = 'res/playeranimframe.png',
                width = 150;

            var player = new O.Sprite(url, function(img) {
                player.point.x = -width * .5;
                player.point.y = img.height;
            });
            player.start = 1;
            player.end = 1;
            player.width = width;
            player.height = 269;
            player.timer = 600;
            player.position.x = 0;
            player.position.y = -300;
            player.position.z = 0;
            stage.addChild(player);

            return player;
        },
        move: function(speed) {
            if (this.fowardState || this.backState || this.upState || this.downState) {
                var inc = speed / 60;
                var incx, incz;
                if (this.fowardState) incx = inc;
                if (this.backState) incx = -inc;
                if (this.downState) incz = inc;
                if (this.upState) incz = -inc;

                var new_x, new_z;
                incx && (new_x = (this.sprite.position.x += incx));
                incz && (new_z = (this.sprite.position.z += incz));

                if (incx) {
                    var offset = this.sprite.width * .5;
                    this.sprite.position.x = Math.max(Math.min(new_x, 
                        renderer.view.width * .5 - offset), -renderer.view.width * .5 + offset);
                }
                if (incz) {
                    
                }
            }
            
            // if (this.upState) {
                // var new_x = this.sprite.position.x;
                // if (this.onUp) this.onUp(new_x);
            // }

        },
        up: function() {
            this.upState = true;
        },
        down: function() {
            this.downState = true;
        },
        foward: function() {
            this.fowardState = true;
            this.sprite.inversion = true;
            this.sprite.start = 2;
            this.sprite.end = 11;
        },
        stand: function() {
            this.downState = false;
            this.upState = false;
            this.fowardState = false;
            this.backState = false;
            this.sprite.start = 1;
            this.sprite.end = 1;
        },
        back: function() {
            this.backState = true;
            this.sprite.inversion = false;
            this.sprite.start = 2;
            this.sprite.end = 11;
        },
        initChatTips: function() {
            var style = {
                font : '14px 微软雅黑', 
                fill : 0xff1010, 
                align : 'center'
            };

            this.chatText = new O.Text('', style);
            this.updateChatTipsPos();
            this.chatText.visible = false;
            stage.addChild(this.chatText);
        },
        updateChatTipsPos: function() {
            console.log(this.chatText.position.x = this.sprite.position.x);
            console.log(this.chatText.position.y = this.sprite.position.y); //- this.chatText.height);
        },
        showChatTips: function(text) {
            this.updateChatTipsPos();
            this.chatText.setText(text);
            this.chatText.visible = true;
        }
    });

    // 建筑物
    var Building = Class.extend({
        init: function() {
            // 在屋内的用户
            this.users = {};

            // 精灵
            this.sprite = this.create();

            // 内景
            this.interior = this.createInterior();
            
            // 初始化创建门
            this.initDoor();
        },
        setOpts: function() {

        },
        create: function() {
            var url = 'res/shop.png';

            // 铺子
            var building = new O.Sprite(url, function(img) {
                // move the sprite to the center of the screen
                building.point.x = -img.width * .5;
                building.point.y = img.height;
                building.point.z = 0;
            });

            // center the sprite's anchor point
            building.end = 1;
            //building.inversion = true;
            building.width = 800;
            building.height = 681;
            building.timer = 150;
            building.position.x = 0;
            building.position.y = -300;
            building.position.z = 0;
            stage.addChild(building);

            return building;
        },
        createInterior: function() {
            var sence = new Sence({
                create: function() {
                    // 铺子
                    var building = new PIXI.Sprite.fromImage('res/interior.jpg');

                    // center the sprite's anchor point
                    building.anchor.x = 0.5;
                    building.anchor.y = 1.0;

                    // move the sprite to the center of the screen
                    building.position.x = renderer.view.width * .5;
                    building.position.y = renderer.view.height;

                    stage.addChild(building);
                }
            });

            return sence;
        },
        updateDoorPos: function() {
            /*var offset = 338;
            var buildingLeft = this.sprite.position.x - this.sprite.width * .5;
            this.door.left = buildingLeft + offset;
            this.door.right = this.door.left + this.door.width;*/
        },
        initDoor: function() {
            this.door = {};
            this.door.width = 120;
            this.updateDoorPos();
        },
        join: function(user) {
            if (!this.users['user_' + user._id])
                this.users['user_' + user._id] = user;
        },
        hasUser: function(user) {
            return !!this.users['user_' + user._id];
        }
    })

    ///////////////////////////////////////////////////////////////////////
    
    // Stage 的方法
    function clear() {
        for (var i = stage.children.length - 1; i >= 0; i--) {
            stage.removeChild(stage.children[i]);
        };
    }

    function switchSence(sence) {
        clear();
        sence.create();
    }


    // 主视角用户
    var user = new Role({
        isMainView: true,
        onUp: function(px) {
            shop.updateDoorPos();
            var door = shop.door;
            var pOffset = user.sprite.width * .5;
            if (px >= door.left
                && px <= door.right) {
                if (!shop.hasUser(user)) {
                    switchSence(shop.interior);
                    shop.join(user);
                }
            }
        }
    });
    // 店铺
    var shop = new Building();

    // 聊天对话框
    var chatWin = new ChatWin({
        top: 10,
        left: 150,
        direction: 'right',
        onSendMessage: function(messages) {
            user.showChatTips(messages);
        }
    });

    // 商品展示窗口实例
    var productWin = new ProductWin({
        width: 960,
        height: 'auto', 
        top: 50,
        data: [{
            imgurl: 'res/TB1OWSwIXXXXXccXFXXSutbFXXX.jpg',
            price: 30,
        }, {
            imgurl: 'res/TB1OWSwIXXXXXccXFXXSutbFXXX.jpg',
            price: 30,
        }]
    });

    // 键盘操作聊天窗口
    keyboard.addHandle('ctrl + b', function() {
        if (!chatWin.visible) chatWin.show();
        else chatWin.close();
    });
    
    // 键盘操作产品窗口
    keyboard.addHandle('ctrl + q', function() {
        if (!productWin.visible) productWin.show();
        else productWin.close();
    });

    // 键盘用户动作操作
    keyboard.addHandle('down_keydown', function() {
        user.down();
    });

    keyboard.addHandle('up_keydown', function() {
        user.up();
    });

    keyboard.addHandle('right_keydown', function() {
        user.foward();
    });

    keyboard.addHandle('left_keydown', function() {
        user.back();
    });
    
    keyboard.addHandle('down_keyup', function() {
        user.stand();
    });

    keyboard.addHandle('up_keyup', function() {
        user.stand();
    });

    keyboard.addHandle('right_keyup', function() {
        user.stand();
    });

    keyboard.addHandle('left_keyup', function() {
        user.stand();
    });

    /////////////////////////////////////////////////////////////////////////

    // 添加循环动画
    animation.addHandle('tick', function() {
        renderer.render(stage);
    });

    animation.registerAnimation();
})(this)
