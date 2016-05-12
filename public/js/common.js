$(function() {

	/******** 工具栏 ********/
	//画笔工具
	$('.draw-options').find('li').children('button').click(function(event) {
		sType = $(this).attr("aria-label");
		if(sType == "文字") {
			bNeedReset = true;
			slider.options.min = 14;
			slider.options.max = 40;
			slider.setValue(20);
			ctx.font = slider.getValue() + "px Arial";
		} else {
			slider.options.min = 1;
			slider.options.max = 20;
			if(bNeedReset) {
				slider.setValue(1);
			}
			bNeedReset = false;
			ctx.lineWidth = slider.getValue();
		}

		var oUl = $(this).parents('ul');
		if(oUl.attr('class') == 'dropdown-menu tools') {
			var selected = $(this).children('span').attr('class');
			oUl.siblings('button').children('span').eq(0).attr('class', selected);
		}
		if(oUl.attr('class') == 'dropdown-menu shapes') {
			var selected = $(this).children('span').html();
			oUl.siblings('button').children('span').eq(0).html(selected);
		}

	});

	$('#colorValue').change(function(event) {
		$('.colors').css('color', '#' + this.value);
		ctx.strokeStyle = '#' + this.value;
	});

	var slider = new Slider('.stroke', {
		reversed : true,
		tooltip: 'always',
		min: 1,
		max: 20,
		value: 1,
		orientation: 'vertical',
		formatter: function() { //tooltip格式
			return arguments[0] + 'px';
		}
	});

	slider.on("slideStop", function() {
		ctx.lineWidth = slider.getValue();
		ctx.font = slider.getValue() + "px Arial";
	});

	//操作工具
	$('.operations').find('button').click(function(event) {
		switch($(this).attr('aria-label')) {
			case "撤销": {
				fUndraw();
				break;
			}
			case "重做": {
				fRedraw();
				break;
			}
			case "重置": {
				fClearBoard();
				fHistoryAdd();
				break;
			}
		}
	});

	/******** 画板 ********/
	$("#board").attr('width', $('#container').width());
	$("#board").attr('height', window.innerHeight - $('.row').height());

	//初始参数
	var nX, nY, nEndX, nEndY;
	var nMinX, nMinY, nMaxX, nMaxY;
	var bIsPaint = false; //绘制标识
	var ctx = $("#board").get(0).getContext("2d"); //画布对象
	var sType = "画笔"; //工具类型
	var bNeedReset = false; //重置标识

	//历史记录
	var aHistory = new Array();
	var nStep = -1;

	//鼠标拖动需要用的示意框
	var shapeTip = $("<div class='tip'></div>");
	var wordTip = $("<textarea class='tip'></textarea>"); 
	var OCRTip = $("<div class='tip OCRTip'></div>");
	var OCRCanvas = $("<canvas class='tip'></canvas>");

	$('#container').append(shapeTip);
	$('#container').append(wordTip);
	$('#container').append(OCRTip);
	$('#container').append(OCRCanvas);

	//绑定鼠标绘制事件
	$('#container').mousemove(fDraw); 

	$("#container").mousedown(function(e){ //鼠标按下 
        bIsPaint = true; //设置绘画标识
        //设置画笔起始点
        var offset = $("#board").offset();
        nX = e.pageX - offset.left;
		nY = e.pageY - offset.top;

		nMinX = nMaxX = nX;
		nMinY = nMaxY = nY;

		//判断工具类型执行相应函数
		switch(sType) {
		 	case "画笔": {
		 		ctx.strokeStyle = $('.colors').css('color');
		 		break;
		 	}
          	case "橡皮": {
          		ctx.strokeStyle = "#fff";
          		break;
          	}
         	case "文字": {
         		var sTipFontSize = ctx.font.split(' ')[0];
         		wordTip.css({
         			color: ctx.strokeStyle,
         			'font-size': sTipFontSize
         		});
          		break;
         	}
          	case "图片":
          		break;
          	case "矩形": {
			    var border = ctx.lineWidth + "px " + ctx.strokeStyle + " solid";
			    shapeTip.css({
				   "border": border,
				   "border-radius": 0
			   	});
				break;    
			}
			case "椭圆": {
				var border = ctx.lineWidth + "px " + ctx.strokeStyle + " solid";
			    shapeTip.css({
				   "border": border,
			   	});
				break;    
			}
			case "直线": {
			    var border = ctx.lineWidth / 2 + "px " + ctx.strokeStyle + " solid";
			    shapeTip.css({
				   "border": border,
			   	});
				break;    
			}
			case "OCR": {
				break;
			}
		}
  	});

	//根据工具选择绘制函数
	function fDraw(e) { //鼠标移动
		switch(sType) {
			case "画笔": 
			case "橡皮": {
				fDrawFree(e);
				break;
			}
			case "文字": {
				fDrawWordTip(e);
				break;
			} 
			case "矩形": {
				fDrawRectTip(e);
				break;
			}
			case "椭圆": {
				fDrawOvalTip(e);
				break;    
			}
			case "直线": {
				fDrawLineTip(e);
				break;
			}
			case "OCR": {
				fDrawOCRTip(e);
				break;
			}
		}
	}

  	$("#container").mouseup(function(e){ //鼠标放开
        bIsPaint = false;
		switch(sType) {
		 	case "画笔": {
		 		fDoOCR(nMinX, nMinY, nMaxX - nMinX, nMaxY - nMinY);
		 		break;
		 	}
          	case "橡皮":
          		break;
          	case "文字": {
          	 	break;
          	}
          	case "矩形": {
          		fDrawRect();
          	 	break;
          	}
          	case "椭圆": {
          		fDrawOval();
          	 	break;
          	}
          	case "直线":	{
          		fDrawLine();
          	 	break;
          	}
          	case "OCR": {
          		fDoOCR(nX, nY, nEndX - nX, nEndY - nY);
          		break;
          	}
		}
		fHistoryAdd(); //增加历史记录	
  	});

  	//绘制任意线条
	function fDrawFree(e) {
		var offset = $("#board").offset();
    	nEndX = e.pageX - offset.left;
    	nEndY = e.pageY - offset.top;

    	//画笔范围
    	nMinX = nMinX < nEndX ? nMinX : nEndX;
    	nMinY = nMinY < nEndY ? nMinY : nEndY;
    	nMaxX = nMaxX > nEndX ? nMaxX : nEndX;
    	nMaxY = nMaxY > nEndY ? nMaxY : nEndY;

		if(bIsPaint) {
			ctx.lineTo(nEndX, nEndY);
			ctx.stroke();  
        } else {
			ctx.beginPath();
		    ctx.moveTo(nEndX, nEndY);
		}
	}

	//绘制文字
	function fDrawWordTip(e) { //根据鼠标绘制文字输入框
        var offset = $("#board").offset();
        nEndX = e.pageX - offset.left;
        nEndY = e.pageY - offset.top;

        if(bIsPaint) {
         	var nLeftX = nX < nEndX ? nX : nEndX;
         	var nTopY = nY < nEndY ? nY : nEndY;
        	wordTip.css({
         		left: nLeftX + offset.left, 
         		top: nTopY
         	});
        	wordTip.width(Math.abs(nEndX - nX));
        	wordTip.height(Math.abs(nEndY - nY));
           	wordTip.attr({
           		placeholder: '在此输入',
           	});
        	wordTip.show();
        }
  	}

  	wordTip.blur(fDrawWord);

  	function fDrawWord() { //鼠标放开时绘制文字
	    var word = wordTip.val();
		if(wordTip.css("display")!= "none" && word) {
		    var offset = $("#board").offset();
		    var offset2 = wordTip.offset();
		    var nFontSize = ctx.font.split('px')[0] - 0;
		    ctx.fillStyle = ctx.strokeStyle;
		    ctx.fillText(word, offset2.left - offset.left, offset2.top - offset.top + nFontSize);
    	  	wordTip.val(""); //清空已有文字
		}
		wordTip.hide();
		fDoOCR(offset2.left - offset.left, offset2.top - offset.top, nFontSize * word.length, nFontSize);
  	}

	//绘制矩形
	function fDrawRectTip(e) { //根据鼠标绘制矩形示意框
  	    var offset = $("#board").offset();
        nEndX = e.pageX - offset.left;
        nEndY = e.pageY - offset.top;
        if(bIsPaint) {
        	var nLeftX = nX < nEndX ? nX : nEndX;
        	var nTopY = nY < nEndY ? nY : nEndY;
        	shapeTip.css({
        		left: nLeftX + offset.left - ctx.lineWidth / 2, 
        		top: nTopY - ctx.lineWidth / 2
        	});
           	shapeTip.width(Math.abs(nEndX - nX) - ctx.lineWidth);
           	shapeTip.height(Math.abs(nEndY - nY) - ctx.lineWidth);
           	shapeTip.show();
        }
  	}

  	function fDrawRect() { //鼠标放开时绘制矩形
	    ctx.strokeRect(nX, nY, nEndX - nX, nEndY - nY);
	 	$("#board").focus(); 
	    shapeTip.hide();
  	}

  	//绘制椭圆
  	function fDrawOvalTip(e) { //根据鼠标绘制椭圆示意框
		var offset = $("#board").offset();
        nEndX = e.pageX - offset.left;
        nEndY = e.pageY - offset.top;
        var nShapeTipWidth = Math.abs(nEndX - nX) - ctx.lineWidth;
        var nShapeTipHeight = Math.abs(nEndY - nY) - ctx.lineWidth;
        if(bIsPaint) {
        	var nLeftX = nX < nEndX ? nX : nEndX;
        	var nTopY = nY < nEndY ? nY : nEndY;
        	shapeTip.css({
        		left: nLeftX + offset.left - ctx.lineWidth / 2, 
        		top: nTopY - ctx.lineWidth / 2,
        		'border-radius': nShapeTipWidth/2 + 'px/' + nShapeTipHeight/2 + 'px'
        	});
           	shapeTip.width(nShapeTipWidth);
           	shapeTip.height(nShapeTipHeight);
           	shapeTip.show();
        }
  	}

	function fDrawOval() {
		var nOvalX = (nEndX + nX) / 2; //椭圆中心横坐标
		var nOvalY = (nEndY + nY) / 2; //椭圆中心纵坐标
		var nOvalA = Math.abs(nEndX - nX) / 2; //椭圆横半轴长
		var nOvalB = Math.abs(nEndY - nY) / 2; //椭圆纵半轴长
	   	var nOvalR = (nOvalA > nOvalB) ? nOvalA : nOvalB; //选择nOvalA、nOvalB中的较大者作为arc方法的半径参数
	   	var nRatioX = nOvalA / nOvalR; //横轴缩放比率
	   	var nRatioY = nOvalB / nOvalR; //纵轴缩放比率
	   	ctx.save();
	   	ctx.scale(nRatioX, nRatioY); //进行缩放（均匀压缩）
	   	ctx.beginPath();
	   	//从椭圆的左端点开始逆时针绘制
	   	ctx.moveTo((nOvalX + nOvalA) / nRatioX, nOvalY / nRatioY);
	   	ctx.arc(nOvalX / nRatioX, nOvalY / nRatioY, nOvalR, 0, 2 * Math.PI);
	   	ctx.closePath();
	   	
	   	ctx.restore();
	   	ctx.stroke();
	   	shapeTip.hide();
	};

  	//绘制直线
	function fDrawLineTip(e) { //根据鼠标绘制直线示意线段
  	    var offset = $("#board").offset();
        nEndX = e.pageX - offset.left;
        nEndY = e.pageY - offset.top;
        if(bIsPaint) {
        	//设置左上角
        	shapeTip.css({
        		left: nX + offset.left - ctx.lineWidth / 2, 
        		top: nY - ctx.lineWidth / 2
        	});

			shapeTip.width(0);
			var nLength = Math.sqrt(Math.pow(nEndX - nX, 2) + Math.pow(nEndY - nY, 2));
			shapeTip.height(nLength - ctx.lineWidth);

			//设置旋转原点
        	var sOriginX = 0;
        	var sOriginY = 0;
			var sTransformOrigin = sOriginX + ' ' + sOriginY;

			//设置旋转角度
			var nDegree = - Math.atan2(nEndX - nX, nEndY - nY) / Math.PI * 180;
			var sRotate = 'rotate(' + nDegree + 'deg)';
			shapeTip.css({
				'transform': sRotate,
				'transform-origin': sTransformOrigin,
				'-ms-transform': sRotate, /* IE 9 */
				'-ms-transform-origin': sTransformOrigin, /* IE 9 */
				'-webkit-transform': sRotate, /* Safari and Chrome */
				'-webkit-transform-origin': sTransformOrigin, /* Safari and Chrome */
				'-moz-transform': sRotate, /* Firefox */
				'-moz-transform-origin': sTransformOrigin, /* Firefox */
				'-o-transform': sRotate, /* Opera */
				'-o-transform-origin': sTransformOrigin /* Opera */
			});
			shapeTip.show();
        }
  	}

  	function fDrawLine() { //鼠标放开时绘制直线
  		ctx.beginPath();
  		ctx.moveTo(nX, nY);
	    ctx.lineTo(nEndX, nEndY);
	    ctx.stroke();  
	 	$("#board").focus(); 
	    shapeTip.hide();
  	}


  	//操作工具函数
  	function fHistoryAdd() { //增加历史记录
	    nStep++;
		if(nStep < aHistory.length) { 
			aHistory.length = nStep; 
	  	}
	  	var sTemp = $("#board").get(0).toDataURL();
	  	aHistory.push(sTemp);

	  	socket.emit('draw', sTemp);
  	}

  	function fUndraw() { //撤销
		if (nStep >= 0) {
	  		nStep--;
	  		if(nStep == -1) {
	  			fClearBoard();
	  		} else {
	  			var oTemp = new Image();
	  			oTemp.src = aHistory[nStep];
	  			oTemp.onload = function() { 
		  			fClearBoard();
		  			ctx.drawImage(oTemp, 0, 0);
	  			};
	  		}
  		}
	}
		    	  
	function fRedraw() { //重做
		if (nStep < aHistory.length - 1) {
			nStep++;
			var oTemp = new Image();
	  		oTemp.src = aHistory[nStep];
	  		oTemp.onload = function() { 
	  			fClearBoard();
	  			ctx.drawImage(oTemp, 0, 0);
	  		};
		}
	}

  	function fClearBoard() { //清空画板
  		ctx.fillStyle = "#fff";
	  	ctx.clearRect(0, 0, $("#board").width(), $("#board").height());
	}

	//用户工具
	$('.others').find('button').click(function(event) {
		switch($(this).attr('aria-label')) {
			case "用户": {
				//fUndraw();
				break;
			}
			case "下载": {
				fDownloadImg();
				break;
			}
			case "OCR": {
				sType = "OCR";
				break;
			}
		}
	});

	function fDownloadImg() { //下载

		var timeStamp = new Date().getTime();//时间戳
		var sImgOpt = "image/octet-stream;";
		sImgOpt += "Content-Disposition:attachment;";
		sImgOpt += "filename=" + timeStamp + ".png";//图片名

		var sDataURL = $("#board").get(0)
						.toDataURL('image/png')
						.replace("image/png", sImgOpt);
	    document.location.href = sDataURL;
	}

	function fDrawOCRTip(e) { //根据鼠标绘制OCR示意框
  	    var offset = $("#board").offset();
        nEndX = e.pageX - offset.left;
        nEndY = e.pageY - offset.top;
        if(bIsPaint) {
        	var nLeftX = nX < nEndX ? nX : nEndX;
        	var nTopY = nY < nEndY ? nY : nEndY;
        	OCRTip.css({
        		left: nLeftX + offset.left, 
        		top: nTopY
        	});
           	OCRTip.width(Math.abs(nEndX - nX));
           	OCRTip.height(Math.abs(nEndY - nY));
           	OCRTip.show();
        }
  	}

  	function fDoOCR(x, y, width, height) {
  		var oImgOCR = ctx.getImageData(x, y, width, height);
		OCRCanvas.attr({
			width: width,
			height: height
		});
		OCRCanvas.get(0).getContext("2d").putImageData(oImgOCR,0,0);
		var sDataURL = OCRCanvas.get(0).toDataURL().substring(22);
		socket.emit('OCR', sDataURL); //发送文字识别请求
		
		OCRTip.hide();
  	}


	/******** 通讯 ********/
	var socket = io.connect(window.location.origin);

	//画板初始化
	socket.on('init', function(data) {
		fOtherHistoryAdd(data);
	});

	//画板同步
	socket.on('draw', function(data) {
		fOtherHistoryAdd(data);
	});

	//OCR
	socket.on('OCR', function(data) {
		if(data.status) {
			for(var i = 0; i < data.texts.length; i++) {
				if(data.texts[i] !== '') {
					$('.OCR-panel').find('input')[i].value = data.texts[i];
				} else {
					$('.OCR-panel').find('input')[i].value = '无法识别';
				}
			}
		}
	});

	//增加其他用户历史记录
	function fOtherHistoryAdd(dataURL) { 
		if(dataURL) {
			nStep++;
			if(nStep < aHistory.length) { 
				aHistory.length = nStep; 
		  	}
		  	var oTemp = new Image();
		  	oTemp.src = dataURL;
		  	oTemp.onload = function() { 
		  		ctx.drawImage(oTemp, 0, 0);
		  	};
		  	aHistory.push(dataURL);
		}
  	}
});
