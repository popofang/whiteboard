$(function() {

	/******** 工具栏 ********/
	//画笔工具栏
	$('.draw-options').find('li').children('button').click(function(event) {

		//由aria-label确认所选功能
		sType = $(this).attr("aria-label");

		//拖动条属性重设
		if(sType == "文字") { //拖动条文字重设
			bNeedResetSize = true;
			slider.options.min = 14;
			slider.options.max = 40;
			slider.setValue(20);
			ctx.font = slider.getValue() + "px Arial"; //文字大小由font属性指定
		} else { //拖动条笔触粗细重设
			slider.options.min = 1;
			slider.options.max = 20;
			if(bNeedResetSize) {
				slider.setValue(1);
			}
			bNeedResetSize = false;
			ctx.lineWidth = slider.getValue(); //笔触粗细由font属性指定
		}

		//将所选中的功能替换至功能列表头显示的span中
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

	//调色板
	$('#colorValue').change(function(event) {
		bNeedResetColor = true;
		$('.colors').css('color', '#' + this.value);
	});

	//拖动条
	var slider = new Slider('.stroke', { //初始化
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

	//重置工具
	$('.reset').click(function(event) {
		//确认框
		bootbox.confirm({ 
			title: "确认框",
			buttons: {  
	            confirm: {  
	                label: '确认'
	            },  
	            cancel: {  
	                label: '取消' 
	            }  
	        },  
		    message: '该操作会影响所有在线用户，确定清空画板？', 
		    callback: function(result){ 
		    	if(result) {
		    		fClearBoard();
		    		console.log(Date() + ' 确认，画板已清空');
		    		$('.OCR-panel').find('input').val('');
		    		socket.emit('reset');
		    	} else {
		    		console.log(Date() + ' 取消，画板未清空');
		    	}
		    }
		});
	});

	slider.on("slideStop", function() { //拖动条数值改变的监听
		if(sType == "文字") {
			ctx.font = slider.getValue() + "px Arial";
		} else {
			ctx.lineWidth = slider.getValue();
		}
	});

	//操作工具
	$('.history').click(function(event) {
		switch($(this).attr('aria-label')) {
			case "上一步": {
				nSeq--;
				console.log("向前:序号" + nSeq);
				if(nSeq >= 0) {
					socket.emit('history', nSeq);
				} else if(nSeq == -1) {
					fClearBoard();
				}
				break;
			} 
			case "下一步": {
				nSeq++;
				console.log("向后:序号" + nSeq);
				socket.emit('history', nSeq);
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
	var bNeedResetSize = false; //重置大小标识
	var bNeedResetColor = true; //重置颜色标识
	var nSeq = -1; //操作记录
var drawingSurfaceData;
var numDown=0;
var nCX1,nCY1,nCX2,nCY2,nCX3,nCY3;
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

		//初始化画笔范围
		nMinX = nMaxX = nX;
		nMinY = nMaxY = nY;

		//初始化画笔颜色
		if(bNeedResetColor) {
			ctx.strokeStyle = $('.colors').css('color');
			bNeedResetColor = false;
		}

		//判断工具类型执行相应函数
		switch(sType) {
		 	case "画笔": {
		 		ctx.strokeStyle = $('.colors').css('color');
		 		break;
		 	}
          		case "橡皮": {
          			bNeedResetColor = true;
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
			   	fRotateTip(0);
				break;    
			}
			case "椭圆": {
				var border = ctx.lineWidth + "px " + ctx.strokeStyle + " solid";
			    shapeTip.css({
				   "border": border,
			   	});
			   	fRotateTip(0);
				break;    
			}

			case "三角形": {
				var border = ctx.lineWidth + "px " + ctx.strokeStyle + " solid";
			    shapeTip.css({
				   "border": border,
				"border-radius": 0
			   	});
			   	fRotateTip(0);
				break;    
			}
			case "直线": {
			    var border = ctx.lineWidth / 2 + "px " + ctx.strokeStyle + " solid";
			    shapeTip.css({
				   "border": border,
			   	});
				break;    
			}
			case "曲线": {
				numDown+=1;
			   	//画初始点

				if(numDown==1){
					nCX1=nX;
					nCY1=nY;
					ctx.beginPath();
					ctx.arc(nX,nY,ctx.lineWidth/2,0,2*Math.PI);
					ctx.stroke();
				}
				else if(numDown>=3){
					numDown=1;
					nCX1=nX;
					nCY1=nY;
					ctx.beginPath();
					ctx.arc(nX,nY,ctx.lineWidth/2,0,2*Math.PI);
					ctx.stroke();			}
				else{
					break;
				}
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
			case "三角形": {
				fDrawSvalTip(e);
				break;    
			}
			case "直线": {
				fDrawLineTip(e);
				break;
			}
			case "曲线": {
				fDrawQineTip(e);
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
		 		fDoOCR(nMinX - ctx.lineWidth / 2, nMinY - ctx.lineWidth / 2, nMaxX - nMinX + ctx.lineWidth, nMaxY - nMinY + ctx.lineWidth);
		 		console.log(Date() + ' 画笔绘制');
		 		break;
		 	}
          		case "橡皮":
          			console.log(Date() + ' 橡皮擦除');
          			break;
          		case "文字": {
          	 		break;
          		}
		  	case "矩形": {
		  		fDrawRect();
		  		console.log(Date() + ' 矩形绘制');
		  	 	break;
		  	}
		  	case "椭圆": {
		  		fDrawOval();
		  		console.log(Date() + ' 椭圆绘制');
		  	 	break;
		  	}
		  	case "三角形": {
		  		fDrawSval();
		  		console.log(Date() + ' 三角形绘制');
		  	 	break;
		  	}
		  	case "直线":	{
		  		fDrawLine();
		  		console.log(Date() + ' 直线绘制');
		  	 	break;
		  	}
		  	case "曲线":	{
		  		fDrawQine();
		  		console.log(Date() + ' 曲线绘制');
		  	 	break;
		  	}
		  	case "OCR": {
		  		fDoOCR(nX, nY, nEndX - nX, nEndY - nY);
		  		break;
		  	}
		}

		//同步画板内容
		if(sType !== '文字' && sType !== 'OCR') {
			var sTemp = $("#board").get(0).toDataURL();
	  		socket.emit('draw',  {
	  			dataURL: sTemp
	  		});
		}
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
		console.log(Date() + ' 文字绘制');

		//显示输入文本
		$('.OCR-panel').find('input').val(word);

		//同步画板内容和OCR框
		var sTemp = $("#board").get(0).toDataURL();
	  	socket.emit('draw', {
	  		dataURL: sTemp,
	  		word: word
	  	});
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
  	//绘制三角形
  	function fDrawSvalTip(e) { //根据鼠标绘制椭圆示意框
		var offset = $("#board").offset();
        nEndX = e.pageX - offset.left;
        nEndY = e.pageY - offset.top;

	$("#board").get(0).onmousedown = function()
	{	
		 drawingSurfaceData = ctx.getImageData(0,0,$("#board").get(0).width,$("#board").get(0).height);
	}
	

	if(bIsPaint) {
		ctx.putImageData(drawingSurfaceData,0,0);
	   	
		ctx.beginPath();
		ctx.moveTo(nX,nY);
		ctx.lineTo(nEndX,nEndY);
		ctx.lineTo(nX,nEndY);
	   	ctx.closePath(); 
	   	ctx.stroke();
        }

	
        
  	}
	function fDrawSval() {
	   	ctx.beginPath();
		ctx.moveTo(nX,nY);
		ctx.lineTo(nEndX,nEndY);
		ctx.lineTo(nX,nEndY);
	   	ctx.closePath(); 
	   	ctx.stroke();
	   	
	};  	

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
	   	//从椭圆的右端点开始顺时针绘制
	   	ctx.moveTo((nOvalX + nOvalA) / nRatioX, nOvalY / nRatioY);
	   	ctx.arc(nOvalX / nRatioX, nOvalY / nRatioY, nOvalR, 0, 2 * Math.PI);
	   	ctx.closePath();
	   	
	   	ctx.restore();
	   	ctx.stroke();
	   	shapeTip.hide();
	};
	//绘制曲线
	function fDrawQineTip(e) { //根据鼠标移动绘制直线示意线段
		var offset = $("#board").offset();
		nEndX = e.pageX - offset.left;
		nEndY = e.pageY - offset.top;
		if(bIsPaint) {

		
			if(numDown==2){
				nCX2=nEndX;
				nCY2=nEndY;

		
				ctx.putImageData(drawingSurfaceData,0,0);
			
				ctx.beginPath();
				ctx.moveTo(nCX1,nCY1);
				ctx.quadraticCurveTo(nCX2,nCY2,nCX3,nCY3);
				ctx.stroke();
				ctx.closePath(); 
			}
		}		

				
		
		
  	}

  	function fDrawQine() { //鼠标放开时绘制直线
		if(numDown==1){

			nCX3=nEndX;
			nCY3=nEndY;
			ctx.beginPath();
			ctx.arc(nEndX,nEndY,ctx.lineWidth/2,0,2*Math.PI);
			ctx.stroke();
			drawingSurfaceData = ctx.getImageData(0,0,$("#board").get(0).width,$("#board").get(0).height);
		} 		
		if(numDown==2){
			ctx.beginPath();
			ctx.moveTo(nCX1,nCY1);
			ctx.quadraticCurveTo(nCX2,nCY2,nCX3,nCY3);
			ctx.stroke();
			ctx.closePath(); 
		}
	 	 
	    
  	}

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

			//改造shapeTip形状，使其成为直线
			shapeTip.width(0);
			var nLength = Math.sqrt(Math.pow(nEndX - nX, 2) + Math.pow(nEndY - nY, 2));
			shapeTip.height(nLength - ctx.lineWidth);

			//设置旋转角度
			var nDegree = - Math.atan2(nEndX - nX, nEndY - nY) / Math.PI * 180;
			//旋转shapeTip
			fRotateTip(nDegree);
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

  	function fRotateTip(degree) {
  		var sRotate = 'rotate(' + degree + 'deg)';
		shapeTip.css({
			'transform': sRotate,
			'transform-origin': '0 0',
			'-ms-transform': sRotate, /* IE 9 */
			'-ms-transform-origin': '0 0', /* IE 9 */
			'-webkit-transform': sRotate, /* Safari and Chrome */
			'-webkit-transform-origin': '0 0', /* Safari and Chrome */
			'-moz-transform': sRotate, /* Firefox */
			'-moz-transform-origin': '0 0', /* Firefox */
			'-o-transform': sRotate, /* Opera */
			'-o-transform-origin': '0 0' /* Opera */
		});
  	}


  	//操作工具函数  
  	function fClearBoard() { //清空画板
  		ctx.fillStyle = "#fff";
	  	ctx.clearRect(0, 0, $("#board").width(), $("#board").height());
	}

	//用户工具
	$('.others').find('button').click(function(event) {
		switch($(this).attr('aria-label')) {
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

		console.log(Date() + ' 识别开始');
		socket.emit('OCR', sDataURL); //发送文字识别请求
		
		OCRTip.hide();
  	}


	/******** 通讯 *******/
	//var socket = io.connect(window.location.origin);
    var socket = io.connect("ws:" + window.location.href.substring(window.location.protocol.length).split('#')[0]);
	//画板初始化
	socket.on('init', function(data) {
		fShowHistory(data);

	});

	//画板用户人数
	socket.on('user', function(data) {
		$('.others').children('span').html('在线用户:' + data);
	});

	//画板同步
	socket.on('draw', function(data) {
		fShowHistory(data);
	});

	socket.on('seqSync', function(data) {
		nSeq = data;
	});

	//画板重置
	socket.on('reset', function(data) {
		fClearBoard();
	});

	//历史记录
	socket.on('history', function(data) {
		var oTemp = new Image();
		if(data) {
			oTemp.src = data.dataURL;
	  		oTemp.onload = function() {
		  		fClearBoard(); 
		  		ctx.drawImage(oTemp, 0, 0);
		  	};
		}
	});

	//OCR
	socket.on('OCR', function(data) {
		if(data.status) {
			for(var i = 0; i < data.texts.length; i++) {
				if(data.texts[i] !== '') {
					$('.OCR-panel').find('input').get(i).value = data.texts[i];
				} else {
					$('.OCR-panel').find('input').val('无法识别');
				}
			}
			console.log(Date() + ' 识别完成');
		}
	});

	//增加其他用户历史记录
	function fShowHistory(data) { 
		if(data) {
			nSeq = data.seq;
		  	var oTemp = new Image();
		  	oTemp.src = data.dataURL;
		  	oTemp.onload = function() { 
		  		ctx.drawImage(oTemp, 0, 0);
		  	};
		  	if(data.word) {
		  		$('.OCR-panel').find('input').val(data.word);
		  	}
		}
  	}
});
