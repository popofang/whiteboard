$(function() {
	/******** 工具栏 ********/

	//画笔工具
	$('.draw-options').find('li').children('button').click(function(event) {
		var selected = $(this).children('span').attr('class');
		sType = $(this).attr("aria-label");
		if(sType == "文字") {
			slider.options.min = 10;
			slider.options.max = 40;
			slider.setValue(10);
			ctx.font = slider.getValue() + "px Arial";
		} else {
			slider.options.min = 1;
			slider.options.max = 20;
			slider.setValue(1);
			ctx.lineWidth = slider.getValue();
		}
		$(this).parents('ul').siblings('button').children('span').eq(0).attr('class', selected);
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
			case "刷新": {
				break;
			}
			case "重置": {
				fClearBoard();
				break;
			}
		}
	});

	/******** 画板 ********/
	$("#board").attr('width', $('#container').width());
	$("#board").attr('height', window.innerHeight - $('.row').height());

	//初始参数
	var nX, nY, nEndX, nEndY;
	var bIsPaint = false; //绘制标识
	var ctx = $("#board").get(0).getContext("2d"); //画布对象
	var sType = "画笔"; //工具类型

	//历史记录
	var aHistory = new Array();
	var nStep = -1;

	//鼠标拖动需要用的示意框
	var shapeTip = $("<div class='tip'></div>");
	var wordTip = $("<textarea class='tip'></textarea>"); 
	$('#container').append(shapeTip);
	$('#container').append(wordTip);

	//绑定鼠标绘制事件
	$('#container').mousemove(fDraw); 

	$("#container").mousedown(function(e){ //鼠标按下 
        bIsPaint = true; //设置绘画标识
        //设置画笔起始点
        var offset = $("#board").offset();
        nX = e.pageX - offset.left;
		nY = e.pageY - offset.top;
		//判断工具类型执行相应函数
		switch(sType) {
		 	case "画笔":
		 		break;
          	case "橡皮":
          		break;
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
		}
  	});

	//根据工具选择绘制函数
	function fDraw(e) { //鼠标移动
		switch(sType) {
			case "画笔": {
				fDrawFree(e);
				break;
			}
			case "橡皮": {
				ctx.strokeStyle = "#fff";
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
		}
	}

  	$("#container").mouseup(function(e){ //鼠标放开
        bIsPaint = false;
        fHistoryAdd(); //增加历史记录	
		switch(sType) {
		 	case "画笔":
		 		break;
          	case "橡皮":
          		break;
          	case "文字":
          	 	break;
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
		}
  	});

  	//绘制任意线条
	function fDrawFree(e) {
		if(bIsPaint) {
	    	var offset = $("#board").offset();
	    	var x = e.pageX - offset.left;
	    	var y = e.pageY - offset.top;
			ctx.lineTo(x, y);
			ctx.stroke();  
        } else {
			//???????
			ctx.beginPath();
		    var offset = $("#board").offset();
        	var x = e.pageX - offset.left;
        	var y = e.pageY - offset.top;
		    ctx.moveTo(x, y);
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
         		left: nLeftX + offset.left - ctx.lineWidth / 2, 
         		top: nTopY - ctx.lineWidth / 2
         	});
        	wordTip.width(Math.abs(nEndX - nX) - ctx.lineWidth);
        	wordTip.height(Math.abs(nEndY - nY) - ctx.lineWidth);
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
    	  	wordTip.val(""); 
		}
		wordTip.hide();
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
		var nOvalA = (nEndX - nX) / 2; //椭圆横半轴长
		var nOvalB = (nEndY - nY) / 2; //椭圆纵半轴长
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
        	var nLeftX = nX < nEndX ? nX : nEndX;
        	var nTopY = nY < nEndY ? nY : nEndY;
        	shapeTip.css({
        		left: nLeftX + offset.left - ctx.lineWidth / 2, 
        		top: nTopY - ctx.lineWidth / 2
        	});

			shapeTip.width(0);
			var nLength = Math.sqrt(Math.pow(nEndX - nX, 2) + Math.pow(nEndY - nY, 2));
			shapeTip.height(nLength - ctx.lineWidth);

			//设置旋转原点
        	var sOriginX = nX < nEndX ? '0' : '100%';
        	var sOriginY = nY < nEndY ? '0' : '100%';
			var sTransformOrigin = sOriginX + ' ' + sOriginY;

			//设置旋转角度
			var nDegree = - Math.atan((nEndX - nX) / (nEndY - nY)) / Math.PI * 180;
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
  		ctx.moveTo(nX, nY);
	    ctx.lineTo(nEndX, nEndY);
	    ctx.stroke();  
	 	$("#board").focus(); 
	    shapeTip.hide();
  	}


  	//操作函数
  	function fHistoryAdd() { //增加历史记录
	    nStep++;
		if(nStep < history.length) { 
			history.length = nStep; 
	  	}
	  	aHistory.push($("#board").get(0).toDataURL());
  	}

  	function fUndraw() { //撤销
		if (nStep >= 0) {
	  		fClearBoard();
	  		nStep--;
	  		var oTemp = new Image();
	  		oTemp.src = aHistory[nStep];
	  		oTemp.onload = function() { 
	  			ctx.drawImage(oTemp, 0, 0);
	  		};
  		}
	}
		    	  
	function fRedraw() { //重做
		if (nStep < history.length - 1) {
			fClearBoard();
			nStep++;
			var oTemp = new Image();
	  		oTemp.src = aHistory[nStep];
	  		oTemp.onload = function() { 
	  			ctx.drawImage(oTemp, 0, 0);
	  		};
		}
	}

  	function fClearBoard() { //清空画板
  		ctx.fillStyle = "#fff";
	  	ctx.clearRect(0, 0, $("#board").width(), $("#board").height());
	}
});