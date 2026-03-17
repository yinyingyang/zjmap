// 视频自动全屏并取消静音脚本
// 使用方法：将此脚本保存为 .js 文件，或在浏览器控制台中运行
// 也可以创建为书签脚本，在视频页面点击运行

(function() {
    'use strict';

    // 查找页面上的视频元素
    const v = document.getElementsByTagName('video')[0];
    v.muted = false;
    v.volume = 1.0;
    v.pause();
    v.play();
    //v.requestFullscreen();

    const t=document.createElement('textarea');
    t.value=v.src;

    document.head.appendChild(t);
    const b=document.createElement('button');
    b.textContent='运行';
    b.onclick=()=>{
       eval(t.value);
    }
    document.head.appendChild(b);

})();
