/*
 * @fileOverview 音频播放器
 * @version 0.1
 * @author minggangqiu
 */
(function() {
    // 检测浏览器版本
    if (!check.checkChrome()) return;

    // 获得播放列表数据
    var xhr = new XMLHttpRequest();
    var music_list = [];

    xhr.onreadystatechange = function(){
        if(xhr.readyState == 4){
            if((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304){
                music_list = JSON.parse(xhr.responseText);
                musicStart(music_list);
            }else{
                alert("error");
            }
        }
    }

    xhr.open("get", "/json/music.json", true);
    xhr.send(null);

    // Player方向常量
    var FORWARD = 1;
    var BACK = 0;

    // Canvas context 常量
    var WEBGL = 1;
    var CANVAS2D = 0;
    
    function musicStart(music_list){
        var initData = {
            volume: 0.618
        };

        var isPlay = true;

        var current_inx = 0;

        var voiceNameBar = document.getElementById('voiceNameBar');
        voiceNameBar.innerText = music_list[current_inx].name;

        var volumeHandle = document.getElementById("volumeHandle");
        var barWidth = 100 - volumeHandle.offsetWidth;

        var audio = document.createElement('AUDIO');
        audio.autoplay = true;
        audio.controls = false;

        var source = document.createElement('SOURCE');
        source.src = music_list[current_inx].src;
        setVolumePosByVolume(initData.volume);

        audio.appendChild(source);
        document.body.appendChild(audio);

        var next_btn = document.getElementById('nextBtn');
        var pause_btn = document.getElementById('pauseBtn');
        var progress = document.getElementById('musicProgress');

        function setVolumePosByVolume(volume) {
            var left = volume*barWidth;
            var vPos = Math.max(Math.min(left,barWidth),0);
            volumeHandle.style.left = vPos + "px";
            audio.volume = volume;
        }

        function setVolumePosByPostion(position) {
            var vPos = Math.max(Math.min(position,barWidth),0);
            volumeHandle.style.left = vPos + "px";
            audio.volume = vPos/barWidth;
        }

        function playNext(){
            current_inx ++;
            (current_inx === music_list.length) && (current_inx = 0);
            source.src = music_list[current_inx].src;
            voiceNameBar.innerText = music_list[current_inx].name;
            isPlay = true;
            audio.load();
        };

        next_btn.onclick = playNext;

        function pause(){
            if(isPlay) audio.pause(),isPlay = false,pause_btn.innerText = '播放';
            else audio.play(),isPlay = true,pause_btn.innerText = '暂停';
        };

        pause_btn.onclick = pause;

        audio.addEventListener("ended", playNext, true);

        var vConBarL = volumeHandle.parentNode.offsetLeft + 10; 

        function on_vmove(evt){
            var left = evt.clientX - vConBarL;
            setVolumePosByPostion(left);
        };

        var volumeBar = document.getElementById("volumeCon");
        volumeBar.addEventListener("mousedown", function(evt){
            var ol = vConBarL+ parseInt(volumeHandle.style.left);
            var left = evt.clientX - vConBarL;
            setVolumePosByPostion(left);

            document.onmousedown = new Function("return false");
            document.onmouseup = new Function("return true");
            
            document.addEventListener("mousemove", on_vmove, false);

            document.addEventListener("mouseup", function(evt){
                document.onmousedown = null;
                document.onmouseup = null;
                document.removeEventListener("mousemove", on_vmove, false);
                document.removeEventListener("mouseup", arguments.callee, false);
            }, false);
        });

        // 键盘操作播放器
        keyboard.addHandle('right_keydown', playNext);
        keyboard.addHandle('space_keydown', pause);
        
        // 添加动画
        function loop() {
            progress.style.width = audio.currentTime/audio.duration * 300 + 'px';
        }

        animation.addHandle('tick', loop);

        // 注册动画
        animation.registerAnimation();
    }

    // Webcam recording
    navigator.getMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia
    );

    navigator.getMedia(
        // contraints
        {
            video: true,
            audio: true
        },

        // successCallback
        function(localMediaStream) {
            var video = document.querySelector('video');
            video.src = window.URL.createObjectURL(localMediaStream);
            video.onloadedmetadata = function() {
                
            }
        },

        // errCallback
        function() {
            console.log("The following error occurd:" + err);
        }
    );
})();
