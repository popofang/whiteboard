$(function() {
	/******** 工具 ********/
	$('.options').find('li').children('button').click(function(event) {
		var selected = $(this).children('span').attr('class');
		sType = $(this).attr("aria-label");
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
	});

	slider.on("slideStop", function() {
		ctx.lineWidth = slider.getValue();
	});

	/******** 画板 ********/
	$("#board").attr('width', $('#container').width());
	$("#board").attr('height', window.innerHeight - $('.row').height());

	//初始参数
	var nX, nY, nEndX, nEndY;
	var bIsPaint = false; //绘制标识
	var ctx = $("#board").get(0).getContext("2d");
	var sType = "画笔"; //工具类型
	var shapeTip = $("<div style='position:absolute;border:1px #000 solid;display:none;'></div>");
	var wordTip =$("<textarea style='position:absolute;display:none;'></textarea>"); 
	$('#container').append(shapeTip);
	$('#container').append(wordTip);
	$('#container').mousemove(fDraw); //绑定鼠标绘制事件

	//根据工具选择绘制函数
	function fDraw(e) {
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
			case "文字": 
				fDrawWordTip(e);
				break;
			// case "图片": 
			// 	fDrawFree(e);
			// 	break;
			case "矩形": {
				fDrawRectTip(e);
				break;
			}
			// case "椭圆": 
			// 	fDrawFree(e);
			// 	break;
			case "直线": {
				fDrawLineTip(e);
				break;
			}
		}
	}

	$("#container").mousedown(function(e){  
        bIsPaint = true; //设置绘画标识
        //设置画笔起始点
        var offset = $("#board").offset();
        nX = e.pageX - offset.left;
		nY = e.pageY - offset.top;
		console.log(nX + "," + nY);
		//判断工具类型执行相应函数
		switch(sType) {
		 	case "画笔":
		 		break;
          	case "橡皮":
          		break;
         	case "文字":
          		break;
          	case "图片":
          		break;
          	case "矩形": {
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
			      
  	$("#container").mouseup(function(e){
        bIsPaint = false;
        // records operations history for undo or redo
        //historyPush();	
		switch(sType) {
		 	case "画笔":
		 		break;
          	case "橡皮":
          		break;
          	case "文字":	{
          		fDrawWord();
          	 	break;
          	}
          	case "矩形": {
          		fDrawRect();
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

  	function fDrawRect(e) { //鼠标放开时绘制矩形
	    ctx.strokeRect(nX, nY, nEndX - nX, nEndY - nY);
	 	$("#board").focus(); 
	    shapeTip.hide();
  	}

  	//绘制直线
	function fDrawLineTip(e) { //根据鼠标绘制直线示意线段
  	    var offset = $("#board").offset();
        nEndX = e.pageX - offset.left;
        nEndY = e.pageY - offset.top;
        if(bIsPaint) {
        	var nLeftX = nX < nEndX ? nX : nEndX;
        	var nTopY = nY < nEndY ? nY : nEndY;
        	var sOriginX = nX < nEndX ? '0' : '100%';
        	var sOriginY = nY < nEndY ? '0' : '100%';
        	shapeTip.css({
        		left: nLeftX + offset.left - ctx.lineWidth / 2, 
        		top: nTopY - ctx.lineWidth / 2
        	});
			shapeTip.width(0);
			var nLength = Math.sqrt(Math.pow(nEndX - nX, 2) + Math.pow(nEndY - nY, 2));
			shapeTip.height(nLength - ctx.lineWidth);
			var sTransformOrigin = sOriginX + ' ' + sOriginY;
			console.log(sTransformOrigin);
			var nDegree = - Math.atan((nEndX - nX) / (nEndY - nY)) / Math.PI * 180;
			console.log(Math.atan((nEndX - nX) / (nEndY - nY)) / Math.PI * 180);
			var sRotate = 'rotate(' + nDegree +'deg)';
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

  	function fDrawLine(e) { //鼠标放开时绘制直线
  		ctx.moveTo(nX, nY);
	    ctx.lineTo(nEndX, nEndY);
	    ctx.stroke();  
	 	$("#board").focus(); 
	    shapeTip.hide();
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
           	wordTip.show();
        }
  	}

  	function fDrawWord(e) { //鼠标放开时绘制文字
	    //ctx.strokeRect(nX, nY, nEndX - nX, nEndY - nY);
	 	$("#board").focus(); 
	    //wordTip.hide();
  	}
});