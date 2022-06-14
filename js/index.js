(async function () {
    const $headerBox = $('.header_box'),
        $mainBox = $('.main_box'),
        $footerBox = $('.footer_box'),
        $musicBtn = $headerBox.find('.music_btn'),
        $wrapper = $mainBox.find('.wrapper'),
        $current = $footerBox.find('.current'),
        $already = $footerBox.find('.already'),
        $duration = $footerBox.find('.duration'),
        myAudio = $('#myAudio')[0];
    const computedMainHeight = () => {
        let H = document.documentElement.clientHeight,
            headerH = $headerBox.height(),
            footerH = $footerBox.height();
        $mainBox.css('height', H - headerH - footerH);
    };
    computedMainHeight();
    window.addEventListener('resize', computedMainHeight);
    /* 获取歌词数据 */
    const queryLyric = function queryLyric() {
        return new Promise(resolve => {
            $.ajax({
                url: './json/lyric.json',
                method: 'GET',
                dataType: 'json',
                cache: false,
                success(result) {
                    let {
                        lyric
                    } = result;
                    resolve(lyric);
                }
            });
        });
    };
    /* 动态数据绑定 */
    const render = function render(lyric) {
        //特殊符号替换：val每一次大正则捕获的信息，$1每一次第一次分组捕获的信息
        lyric = lyric.replace(/&#(32|40|41|45);/g, (val, $1) => {
            $1 = +$1;
            switch ($1) {
                case 32:
                    val = "";
                    break;
                case 40:
                    val = "(";
                    break;
                case 41:
                    val = ")";
                    break;
                case 45:
                    val = "-";
                    break;
            };
            return val;
        });
        //捕获歌词和对应的时间&数据绑定
        let str = ``,
            reg = /\[(\d+)&#58;(\d+)&#46;(?:\d+)\]([^&#;]+)(?:&#10;)?/g;
        lyric.replace(reg, (_, minutes, seconds, text) => {
            str += `<p minutes="${minutes}" seconds="${seconds}">${text}</p>`;
        });
        $wrapper.html(str);
        $lyricList = $wrapper.find('p');
    };
    /* 控制音频播放 */
    let timer = null,
        $lyricList,
        num = 0,
        axisY = 0;
    const formatTime = seconds => {
        let minutes = Math.floor(seconds / 60);
        seconds = Math.round(seconds - (minutes * 60));
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        return `${minutes}:${seconds}`;
    };
    const playing = function playing() {
        let H = $lyricList.eq(0).height();
        const next = () => {
            let {
                currentTime,
                duration
            } = myAudio;
            text = formatTime(currentTime),
                [minutes, seconds] = text.split(':');
            //播放完毕
            if (currentTime >= duration) {
                // 播放完毕
                clearInterval(timer);
                timer = null;
                myAudio.pause();
                $musicBtn.removeClass('move');
                $current.html('00:00');
                $already.css('width', 0);
                $wrapper.css('transform', `translateY(0px)`);
                num = 0;
                axisY = 0;
                $lyricList.removeClass('active');
                return;
            }
            //进度条管控
            $already.css('width', currentTime / duration * 100 + '%');
            $current.html(text);
            //歌词对应
            let $item = $lyricList.filter(`[minutes='${minutes}'][seconds='${seconds}']`),
                $active = $lyricList.filter('.active');
            if ($item.length > 0) {
                $item.addClass('active');
                $active.removeClass('active');
                num++;
                if (num >= 4) {
                    axisY -= H;
                    $wrapper.css('transform', `translateY(${axisY}px)`);

                }
            }
        };
        next();
        timer = setInterval(next, 1000);
    };
    const handler = function handler() {
        //点击播放/暂停按钮
        $musicBtn.tap(function () {
            //当前是暂停：我们则开始播放
            if (myAudio.paused) {
                myAudio.play();
                $musicBtn.addClass('move');
                if (!timer) playing();
                return;
            }
            //当前是播放：我们则暂停
            myAudio.pause();
            $musicBtn.removeClass('move');
            clearInterval(timer)
            timer = null;
        });
        myAudio.oncanplay = function () {
            let duration = myAudio.duration;
            $duration.html(formatTime(duration));
        };
    };

    /* 基于AWAIT：保证获取到歌词后，在执行后面的操作*/
    let lyric = await queryLyric();
    render(lyric);
    handler();
})();