/*
 * @fileOverview 渲染器
 * @version 0.1
 * @author minggangqiu
 */
(function(global){
    // 检测浏览器版本
    if (!check.checkChrome()) return;

    var O = function() {
        this.debug = true;
        this.author = "minggangqiu";
        this.engine = null;
        this.shader = {};
        
        // const
        this.RECT = 0;
    }

    O.prototype = {
        createShader: function() {
            // 创建顶点着色器
            this.shader.sprite = {};
            var vsShaderScript = document.createElement('script');
            vsShaderScript.type = "x-shader/x-vertex";

            var vsShaderContext = "attribute vec4 a_position;\
                                 attribute vec2 a_texcoord;\
                                 uniform mat4 u_matrix;\
                                 uniform vec4 u_point;\
                                 varying vec2 v_texcoord;\
                                 void main() {\
                                 vec4 point = a_position + u_point;\
                                 gl_Position = u_matrix * point;\
                                 v_texcoord = a_texcoord;\
                                 }";

            vsShaderScript.innerHTML = vsShaderContext;
            this.shader.sprite.vertex = this.createShaderFromScript(vsShaderScript);

            // 创建片断着色器
            var fsShaderScript = document.createElement('script');
            fsShaderScript.type = "x-shader/x-fragment";

            var fsShaderContext = "precision mediump float;\
                                 varying vec2 v_texcoord;\
                                 uniform vec4 u_color;\
                                 uniform sampler2D u_texture;\
                                 uniform float u_alpha;\
                                 void main() {\
                                 vec4 textureColor = texture2D(u_texture, vec2(v_texcoord.s, v_texcoord.t)) * u_color;\
                                 gl_FragColor = vec4(textureColor.rgb, textureColor.a * u_alpha);\
                                 }";

            fsShaderScript.innerHTML = fsShaderContext;
            this.shader.sprite.fragment = this.createShaderFromScript(fsShaderScript);
        },
        createShaderFromScript: function (shaderScript) {
            var gl = this.engine;
            
            if (!shaderScript) {
                return null;
            }

            var theSource, currentChild, shader;

            theSource = "";
            currentChild = shaderScript.firstChild;

            while(currentChild) {
                if (currentChild.nodeType == currentChild.TEXT_NODE) {
                    theSource += currentChild.textContent;
                }

                currentChild = currentChild.nextSibling;
            }

            if (shaderScript.type == "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if (shaderScript.type == "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                // Unknown shader type
                return null;
            }

            gl.shaderSource(shader, theSource);

            // Compile the shader program
            gl.compileShader(shader);

            // See if it compiled successfully
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                if (o.debug)
                    console.error("An error occurred compiling the shaders: "
                        + gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        },
        getShader: function(name, type) {
            var shaders = this.shader[name];
            if (!shaders) return null;

            var shader = shaders[type];
            return (!shader? null:shader);
        },
        initSpriteConfig: function() {
            var gl = this.engine;

            //gl.enable(gl.CULL_FACE);
            //gl.enable(gl.DEPTH_TEST);

            var vShader = this.getShader("sprite", "vertex");
            var fShader = this.getShader("sprite", "fragment");

            var program = gl.createProgram();

            gl.attachShader(program, vShader);
            gl.attachShader(program, fShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                if (o.debug)
                    console.error("Unable to initialize the shader program.");
            }

            gl.useProgram(program);

            // look up where the vertex data needs to go.
            this.positionLocation = gl.getAttribLocation(program, "a_position");
            this.texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
            this.pointLocation = gl.getUniformLocation(program, "u_point");
            this.alphaLocation = gl.getUniformLocation(program, "u_alpha");
            this.colorLocation = gl.getUniformLocation(program, "u_color");

            // lookup uniforms
            this.matrixLocation = gl.getUniformLocation(program, "u_matrix");
        }
    };

    var o = new O();
    o.debug = true;

    o.Renderer = function(width, height, opts) {
        this.view = document.createElement("canvas");
        this.view.width = width;
        this.view.height = height;
        this.initCtx();
    };

    o.Renderer.prototype = {
        initCtx: function (canvas) {
            // 创建全局变量
            var canvas = this.view,
                gl = null;

            try {
                // 尝试创建标准上下文，如果失败，回退到试验性上下文
                gl = canvas.getContext("webgl", { stencil: true }) 
                    || canvas.getContext("experimental-webgl", { stencil: true });
            }
            catch(e) {
                console.log(e.message);
            }

            if (!gl) {
                alert("您的浏览器缺少某些设备，我们的应用无法在您的浏览器上运行。")
                return;
            }

            o.engine = gl;
            
            // 创建着色器
            o.createShader();
            o.initSpriteConfig();
        },
        render: function(container) {
            var gl = o.engine;
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            container.children.sort(function(prev, next) {
                if (prev.position.z > next.position.z) return true;
                if (prev.position.z == next.position.z) return false;
            });

            for (var i=0;i<container.children.length;++i) {
                var child = container.children[i];
                if (child.visible)
                   child.draw(this);
            }
        }
    };

    o.BasicObject = Class.extend({
        init: function() {
            this.type = "BasicObject";
            this.hover = false;
        },
        addHandle: function(type) {
            // TODO
            switch(type) {
                case 'hover':
                    this.hover = true;
                    break;
                default:
                    break;
            }
        },
        removeHandle: function() {
            // TODO
        }
    });

    o.DisplayObject = o.BasicObject.extend({
        init: function() {
            this._super();
            this.type = "DisplayObject";
            this.position = {};
            this.rotate = {};
            this.scale = {};
            this.position.x = 0;
            this.position.y = 0;
            this.position.z = 0;
            this.rotate.x = 0;
            this.rotate.y = 0;
            this.rotate.z = 0;
            this.scale.x = 1;
            this.scale.y = 1;
            this.scale.z = 1;
            this.alpha = 1.0;
            this.color = [1.0,1.0,1.0,1.0];
            this.visible = true;
            
            this.private = {};
        }
    });

    o.Rand = o.BasicObject.extend({
        init: function(type, array) {
            this._super();
            this.type = "Rand";
            switch(type) {
                case o.RECT:
                    this.randType = type;
                    this.left = array[0];
                    this.right = array[1];
                    this.top = array[2];
                    this.bottom = array[3];
                    break;
                default:
                    break;
            }
        },
        offsetX: function(value) {
            if (this.randType == o.RECT) {
                this.left += value;
                this.right += value;
            }
        },
        offsetZ: function(value) {
            if (this.randType == o.RECT) {
                this.top += value;
                this.bottom += value;
            }
        },
        hitTest: function(rand) {
            if (this.randType == o.RECT) {
                var minx = Math.max(this.left, rand.left)
                , miny = Math.max(this.top, rand.top)
                , maxx = Math.min(this.right, rand.right)
                , maxy = Math.min(this.bottom, rand.bottom);
                
                if ( minx>maxx ) return 0;
                if ( miny>maxy ) return 0;
                return (maxx-minx)*(maxy-miny);
            }

            return false;
        },
        isInRand: function(rand) {
            if (this.randType == o.RECT) {
                return (this.left >= rand.left &&
                       this.right <= rand.right && 
                       this.top >= rand.top &&
                       this.bottom <= rand.bottom)
            }

            return false;
        }
    })

    o.Container = o.DisplayObject.extend({
        init: function() {
            this._super();
            this.type = "Container";
            this.children = [];
            this.levelNum = 0;
        },
        addChild: function(child) {
            this.children.push(child);
            child.private.level = this.levelNum++;
        },
        layerUp: function(child) {
            var curL = child.private.level;
            if (curL < (this.children.length - 1)) {
                var nextL = curL + 1;
                var nextChild = this.children[nextL];
                this.children[curL] = nextChild;
                nextChild.private.level = curL;
                this.children[nextL] = child;
                child.private.level = nextL;
            }
        },
        layerBottom: function(child) {
            var curL = child.private.level;
            if (curL > 0) {
                for (var i=curL-1;i>=0;--i) {
                    var prevChild = this.children[i];
                    var newL = ++prevChild.private.level;
                    this.children[newL] = prevChild;
                }
                child.private.level = 0;
                this.children[0] = child;
            }
        },
        removeChild: function(child) {
            var index = this.children.indexOf(child);
            
            if (index != -1) {
                var r = this.children.splice(index, 1);
                console.log(index, r);
            }
        },
        removeAllChild: function() {
            if (this.children.length > 0)
                this.children.splice(0);
        }
    });

    o.Text = o.DisplayObject.extend({
        init: function(text, opts) {
            this._super();

            this.type = "Text";
            this.text = text;

            this.visible = false;

            this._createTextCanvas();
        },
        _createTextCanvas: function() {
            var textCtx = document.createElement("canvas").getContext("2d");

            this._textCtx = textCtx;
            this._textCanvas = textCtx.canvas;
        },
        setStyle: function() {
            // TODO
        },
        setText: function() {
            var ctx = this._textCtx;
            this.size = 14;
            this.width = text.length * this.size;
            this.height = this.size;
            ctx.canvas.width  = this.width;
            ctx.canvas.height = this.height;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = this.size + "px Microsoft YaHei";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "red";
            ctx.fillText(text, 0, this.height / 2);
        },
        showText: function(text) {
            this.text = text;
            this.setText();
            this.visible = true;
        },
        setBuffer: function() {
            var gl = o.engine;

            // Set point
            gl.uniform4fv(o.pointLocation, [0, 0, 0, 0]);

            // Create a buffer.
            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(o.positionLocation);
            gl.vertexAttribPointer(o.positionLocation, 3, gl.FLOAT, false, 0, 0);
            
            // Set Geometry.
            setGeometry(gl, this.width, this.height);

            // Create a buffer for texcoords.
            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(o.texcoordLocation);

            // We'll supply texcoords as floats.
            gl.vertexAttribPointer(o.texcoordLocation, 2, gl.FLOAT, false, 0, 0);
            
            // Set Texcoords.
            setTexcoords(gl, [0, 1, 0, 1]);

            var cubeVerticesIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  
            // This array defines each face as two triangles, using the
            // indices into the vertex array to specify each triangle's
            // position.

            var cubeVertexIndices = [
                0,  1,  2, 3,  4,  5    // front
            ];

            // Now send the element array to GL

            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                          new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

            // Create a texture.
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            // Fill the texture with a 1x1 blue pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                          new Uint8Array([0, 0, 255, 255]));

                          var self = this;

            // Fill the buffer with the values that define a letter 'F'.
            function setGeometry(gl, width, height) {
                var positions = new Float32Array([
                    // left column front
                    0,   0,  0,
                    0, height,  0,
                    width, 0,  0,
                    width, 0,  0,
                    0, height,  0,
                    width, height,  0
                ]);

                // Center the F around the origin and Flip it around. We do this because
                // we're in 3D now with and +Y is up where as before when we started with 2D
                // we had +Y as down.

                // We could do by changing all the values above but I'm lazy.
                // We could also do it with a matrix at draw time but you should
                // never do stuff at draw time if you can do it at init time.
                var matrix = makeTranslation(0, 0, 0);
                matrix = matrixMultiply(matrix, makeXRotation(Math.PI));

                for (var ii = 0; ii < positions.length; ii += 3) {
                    var vector = matrixVectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
                    positions[ii + 0] = vector[0];
                    positions[ii + 1] = vector[1];
                    positions[ii + 2] = vector[2];
                }

                gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            }

            // Fill the buffer with texture coordinates the F.
            function setTexcoords(gl, rect) {
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array([
                        // left column front
                        rect[0], rect[2],
                        rect[0], rect[3],
                        rect[1], rect[2],
                        rect[1], rect[2],
                        rect[0], rect[3],
                        rect[1], rect[3]
                    ]),
                    gl.STATIC_DRAW);
            }

        },
        bindTexture: function() {
            var gl = o.engine;

            // Now that the image has loaded make copy it to the texture.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, this._textCanvas);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        },
        draw:function(renderer) {
            var gl = o.engine;

            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            this.setBuffer();
            this.bindTexture();

            gl.uniform1f(o.alphaLocation, this.alpha);
            gl.uniform4fv(o.colorLocation, new Float32Array(this.color));

            // Compute the projection matrix
            var fieldOfViewRadians = tools.degToRad(60);
            var aspect = renderer.view.clientWidth / renderer.view.clientHeight;
            var projectionMatrix =
                makePerspective(fieldOfViewRadians, aspect, 1, 2000);

            var cameraZPosition = (renderer.view.clientHeight/2) / Math.tan(tools.degToRad(30));
            var cameraPosition = [0, 0, cameraZPosition];
            var up = [0, 1, 0];
            var target = [0, 0, 0];

            // Compute the camera's matrix using look at.
            var cameraMatrix = makeLookAt(cameraPosition, target, up);

            // Make a view matrix from the camera matrix.
            var viewMatrix = makeInverse(cameraMatrix);

            var translationMatrix = makeTranslation(this.position.x,
                this.position.y, this.position.z);
            var xRotationMatrix = makeXRotation(tools.degToRad(0));
            var yRotationMatrix = makeYRotation(tools.degToRad(0));

            // Multiply the matrices.
            var matrix = yRotationMatrix;
            matrix = matrixMultiply(matrix, xRotationMatrix);
            matrix = matrixMultiply(matrix, translationMatrix);
            matrix = matrixMultiply(matrix, viewMatrix);
            matrix = matrixMultiply(matrix, projectionMatrix);

            // Set the matrix.
            gl.uniformMatrix4fv(o.matrixLocation, false, matrix);

            // Draw the geometry.
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            gl.disable(gl.BLEND);
        }
    });

    o.BorderText = o.Text.extend({
        init: function(text, opt) { 
            this._super(text, opt);

            this.visible = false;
            this.imgloaded = false;

            this.loadBorder();

        },
        loadBorder: function() {
            var self = this;
            this.border = new Image();
            this.border.src = 'res/border.png';
            console.log(this.border);

            this.border.onload = function() {
                self.setText();
                self.imgloaded = true;
            }
        },
        setText: function() {
            var ctx = this._textCtx;
            this.size = 14;
            this.width = 200;
            this.height = 144;
            ctx.canvas.width  = this.width;
            ctx.canvas.height = this.height;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage(this.border, 0, 0);
            ctx.font = this.size + "px Microsoft YaHei";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            ctx.fillText(this.text, 26, 26);
        },
        showText: function(text) {
            this.text = text;
            if (this.imgloaded) {
                this.setText();
            }
            this.visible = true;
        },
        draw: function(renderer) {
            var gl = o.engine;

            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
           
            if (this.imgloaded) {
                this.setBuffer();
                this.bindTexture();
            }

            gl.uniform1f(o.alphaLocation, this.alpha);
            gl.uniform4fv(o.colorLocation, new Float32Array(this.color));

            // Compute the projection matrix
            var fieldOfViewRadians = tools.degToRad(60);
            var aspect = renderer.view.clientWidth / renderer.view.clientHeight;
            var projectionMatrix =
                makePerspective(fieldOfViewRadians, aspect, 1, 2000);

            var cameraZPosition = (renderer.view.clientHeight/2) / Math.tan(tools.degToRad(30));
            var cameraPosition = [0, 0, cameraZPosition];
            var up = [0, 1, 0];
            var target = [0, 0, 0];

            // Compute the camera's matrix using look at.
            var cameraMatrix = makeLookAt(cameraPosition, target, up);

            // Make a view matrix from the camera matrix.
            var viewMatrix = makeInverse(cameraMatrix);

            var translationMatrix = makeTranslation(this.position.x,
                this.position.y, this.position.z);
            var xRotationMatrix = makeXRotation(tools.degToRad(0));
            var yRotationMatrix = makeYRotation(tools.degToRad(0));

            // Multiply the matrices.
            var matrix = yRotationMatrix;
            matrix = matrixMultiply(matrix, xRotationMatrix);
            matrix = matrixMultiply(matrix, translationMatrix);
            matrix = matrixMultiply(matrix, viewMatrix);
            matrix = matrixMultiply(matrix, projectionMatrix);

            // Set the matrix.
            gl.uniformMatrix4fv(o.matrixLocation, false, matrix);

            // Draw the geometry.
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            
            gl.disable(gl.BLEND);

        }
    });

    o.Sprite = o.DisplayObject.extend({
        init: function(url, callback) {
            this._super();
            this.type = "Sprite";

            this.point = {};
            this.point.x = 0;
            this.point.y = 0;
            this.point.z = 0;

            this.width = 0;
            this.height = 0;

            this.imgloaded = false;

            this.inversion = false;
            this.start = 1;
            this.end = 1;
            this.cols = 1;
            this.rows = 1;
            this.time = 0;
            this.timer = 500 / 3;
            this.frameNum = this.start;
            this.frameX = (this.start % this.cols) || this.cols;
            this.frameY = Math.ceil(this.start / this.cols);
            this.rect = [0, 1, 0, 1];

            this.createSprite(url, callback);
        },
        loadImage: function(url, callback) {
            this.img = new Image();
            this.img.src = url;
            var self = this;

            if(this.img.complete) {
                callback.call(this,this.img);
                return;
            };

            this.img.addEventListener("load", function () {
                callback.call(self,self.img);
            },false);
        },
        setBuffer: function() {
            var gl = o.engine;

            // Set point
            gl.uniform4fv(o.pointLocation, [this.point.x, this.point.y, this.point.z, 0]);

            // Create a buffer.
            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(o.positionLocation);
            gl.vertexAttribPointer(o.positionLocation, 3, gl.FLOAT, false, 0, 0);

            // Set Geometry.
            setGeometry(gl, this.width, this.height);

            // Create a buffer for texcoords.
            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(o.texcoordLocation);

            // We'll supply texcoords as floats.
            gl.vertexAttribPointer(o.texcoordLocation, 2, gl.FLOAT, false, 0, 0);
            
            // 
            var inct = 500 / 3;
            this.time += inct;

            if (this.time >= this.timer) {
                if (this.cols > 0 && this.rows > 0) {
                    if (this.frameNum > this.end) {
                        this.frameNum = this.start;
                        this.frameX = (this.start % this.cols) || this.cols;
                        this.frameY = Math.ceil(this.start / this.cols);
                    }

                    var left, right, top, bottom;

                    if (this.frameX > this.cols) {
                        this.frameX = 1;
                        ++this.frameY;
                    }

                    if (this.frameY > this.rows) {
                        this.frameY = 1;
                    }

                    left = (this.frameX - 1) * this.width;
                    right = this.frameX * this.width;
                    top = (this.frameY - 1) * this.height;
                    bottom = this.frameY * this.height;

                    ++this.frameX;

                    this.rect = [left / this.img.width, right / this.img.width, top / this.img.height, bottom / this.img.height];
                    ++this.frameNum;
                }
                this.time = 0;
            };

            // Set Texcoords.
            setTexcoords(gl, this.rect, this.inversion);

            var cubeVerticesIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  
            // This array defines each face as two triangles, using the
            // indices into the vertex array to specify each triangle's
            // position.

            var cubeVertexIndices = [
                0,  1,  2, 3,  4,  5    // front
            ];

            // Now send the element array to GL

            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                          new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

            // Create a texture.
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            // Fill the texture with a 1x1 blue pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                          new Uint8Array([0, 0, 255, 255]));

                          var self = this;

            // Fill the buffer with the values that define a letter 'F'.
            function setGeometry(gl, width, height) {
                var positions = new Float32Array([
                    // left column front
                    0,   0,  0,
                    0, height,  0,
                    width, 0,  0,
                    width, 0,  0,
                    0, height,  0,
                    width, height,  0
                ]);

                // Center the F around the origin and Flip it around. We do this because
                // we're in 3D now with and +Y is up where as before when we started with 2D
                // we had +Y as down.

                // We could do by changing all the values above but I'm lazy.
                // We could also do it with a matrix at draw time but you should
                // never do stuff at draw time if you can do it at init time.
                var matrix = makeTranslation(0, 0, 0);
                matrix = matrixMultiply(matrix, makeXRotation(Math.PI));

                for (var ii = 0; ii < positions.length; ii += 3) {
                    var vector = matrixVectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
                    positions[ii + 0] = vector[0];
                    positions[ii + 1] = vector[1];
                    positions[ii + 2] = vector[2];
                }

                gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            }

            // Fill the buffer with texture coordinates the F.
            function setTexcoords(gl, rect, inversion) {
                var array;
                
                if (inversion == true) {
                    array = [
                        // left column front
                        rect[1], rect[2],
                        rect[1], rect[3],
                        rect[0], rect[2],
                        rect[0], rect[2],
                        rect[1], rect[3],
                        rect[0], rect[3]
                   ];
                }else{
                    array = [
                        // left column front
                        rect[0], rect[2],
                        rect[0], rect[3],
                        rect[1], rect[2],
                        rect[1], rect[2],
                        rect[0], rect[3],
                        rect[1], rect[3]
                    ];
                }

                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array(array),
                    gl.STATIC_DRAW);
            }
        },
        createSprite: function(url, callback) {
            var self = this;
            this.loadImage(url, function(img){
                callback.call(this, img);
                this.imgloaded = true;
            });
        },
        bindTexture: function() {
            var gl = o.engine;

            // Now that the image has loaded make copy it to the texture.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, this.img);

            // Check if the image is a power of 2 in both dimensions.
            if (isPowerOf2(this.img.width) && isPowerOf2(this.img.height)) {
                // Yes, it's a power of 2. Generate mips.
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }

            function isPowerOf2(value) {
                return (value & (value - 1)) == 0;
            }
        },
        getDepth: function(cameraPosition, cameraRotation, objectPosition) {
            var p0 = cameraPosition[0], p1 = cameraPosition[1], p2 = cameraPosition[2],
            q0 = cameraRotation[0], q1 = cameraRotation[1], q2 = cameraRotation[2], q3 = cameraRotation[3],
            l0 = objectPosition[0], l1 = objectPosition[1], l2 = objectPosition[2];
            return 2*(q1*q3 + q0*q2)*(l0 - p0) + 2*(q2*q3 - q0*q1)*(l1 - p1) + (1 - 2*q1*q1 - 2*q2*q2)*(l2 - p2);
        },
        draw: function(renderer) {
            var gl = o.engine;
            
            gl.depthFunc(gl.LESS);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            if (this.imgloaded) {
                this.cols = Math.floor(this.img.width / this.width);
                this.rows = Math.floor(this.img.height / this.height);
                this.setBuffer();
                this.bindTexture();
            }

            gl.uniform1f(o.alphaLocation, this.alpha);
            gl.uniform4fv(o.colorLocation, new Float32Array(this.color));

            // Compute the projection matrix
            var fieldOfViewRadians = tools.degToRad(60);
            var aspect = renderer.view.clientWidth / renderer.view.clientHeight;
            var projectionMatrix =
                makePerspective(fieldOfViewRadians, aspect, 1, 2000);
            
            var cameraZPosition = (renderer.view.clientHeight/2) / Math.tan(tools.degToRad(30));
            var cameraPosition = [0, 0, cameraZPosition];
            var up = [0, 1, 0];
            var target = [0, 0, 0];

            // Compute the camera's matrix using look at.
            var cameraMatrix = makeLookAt(cameraPosition, target, up);

            // Make a view matrix from the camera matrix.
            var viewMatrix = makeInverse(cameraMatrix);

            var translationMatrix = makeTranslation(this.position.x,
                this.position.y, this.position.z);
            var xRotationMatrix = makeXRotation(tools.degToRad(this.rotate.x));
            var yRotationMatrix = makeYRotation(tools.degToRad(this.rotate.y));
            var zRotationMatrix = makeZRotation(tools.degToRad(this.rotate.z));
            var scaleMatrix = makeScale(this.scale.x,
                                        this.scale.y,
                                        this.scale.z);

            // Multiply the matrices.
            var matrix = matrixMultiply(scaleMatrix, zRotationMatrix);
            matrix = matrixMultiply(matrix, yRotationMatrix);
            matrix = matrixMultiply(matrix, xRotationMatrix);
            matrix = matrixMultiply(matrix, translationMatrix);
            matrix = matrixMultiply(matrix, viewMatrix);
            matrix = matrixMultiply(matrix, projectionMatrix);

            // Set the matrix.
            gl.uniformMatrix4fv(o.matrixLocation, false, matrix);

            // Draw the geometry.
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            gl.disable(gl.BLEND);
        }
    });

    global.O = o;
})(this);
