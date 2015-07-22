/*
 * @fileOverview 键盘操作
 * @version 0.1
 * @author minggangqiu
 */
(function(exports) {
    var Keyboard = function() {
        this.keyList = {
            code_17: 'ctrl',
            code_37: 'left',
            code_38: 'up',
            code_39: 'right',
            code_40: 'down',
            code_32: 'space',
        }
        
        this.events = {};
        this.firstKey = {};
        this.init();
    }

    Keyboard.prototype = {
        init: function() {
            var self = this;
            var handle = function(ev) {
                var key_code = ev.keyCode;
                var key_type = ev.type;
                
                var key_name = self.getKeyName(key_code, key_type);
                if (!key_name) return;
                
                // 存储组合键首键
                switch (key_name) {
                    case 'ctrl':
                        if (key_type == 'keydown')
                            self.firstKey[key_name] = true;
                        else if (key_type == 'keyup')
                            self.firstKey[key_name] = false;
                        break;
                    default:
                        break;
                }
                
                var evt = self.getKeyEvent(key_name, key_type);
                if (!evt) return;

                // console.log('key event...')

                // 触发键盘事件处理器
                for (var evi=0;evi<evt.length;++evi) {
                    var ev=evt[evi];
                    // console.log(ev);
                    ev.callback.call(self, ev);
                }
            }
            
            // 注册键盘事件
            document.addEventListener("keydown", handle, true);
            document.addEventListener("keyup", handle, true);
        },
        getKeyName: function(key_code, key_type) {
            var key_name = '';

            // 获得按键名
            if (key_code >= 65 && key_code <= 90) {
                // 字母键
                var diff = 32;
                key_name = String.fromCharCode(key_code + diff);
            } else if (key_code >= 48 && key_code <= 57) {
                key_name = (key_code - 48) + '';
            } else {
                var code_num = 'code_' + key_code;
                key_name = this.keyList[code_num];
            }

            return key_name;
        },
        getKeyEvent: function(key_name, key_type) {
            // 查找并触发单键
            var handle_type = key_name + '_' + key_type;
            var events = this.events;

            // 查找并触发组合键
            var firstKey = this.firstKey;
            if (key_type == 'keydown') {
                for (var k in firstKey) {
                    if (firstKey[k] && k != key_name) {
                        handle_type = k + '_' +  key_name;
                    }
                }
            }

            var evt = events[handle_type];

            return evt;
        },
        addHandle: function(evt, callback) {
            var name = evt;
            
            // 存储事件处理器
            if (evt.indexOf('+') != -1) 
                name = evt.replace(/\s/g, '')
                          .replace('+','_');
            var nevt = {
                name: name,
                callback: callback
            };
            if (!(evt in this.events))
                this.events[name] = [];
            this.events[name].push(nevt);
        }
    };

    exports.keyboard = new Keyboard();
})(this);
