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
	var rectTip = $("<div style='position:absolute;border:1px #000 solid;display:none;'></div>");
	$('#container').append(rectTip);
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
			// case "文字": 
			// 	fDrawFree(e);
			// 	break;
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
			// case "圆形": 
			// 	fDrawFree(e);
			// 	break;
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
   //        	case 4:	
   //        		lineTip.show(); 
   //        		break;
          	case "矩形": {
			    var borderWidth  = ctx.lineWidth + "px"; 
			    var borderColor = ctx.strokeStyle;
			    var border = borderWidth +" " + borderColor + " solid";
			    rectTip.css({
				   "border": border,
			   	});
				break;    
			}
   //        	case 6:
   //        		break;
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
          	case "矩形":
          	 	fDrawRect();
          	 	break;
          	// case 6:	
          	// 	fontTip.focus();
          	// 	break;
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
        }
		else {
			//???????
			ctx.beginPath();
		    var offset = $("#board").offset();
        	var x = e.pageX - offset.left;
        	var y = e.pageY - offset.top;
		    ctx.moveTo(x, y);
		}
	}

	//绘制矩形
	function fDrawRectTip(e) {
  	    var offset = $("#board").offset();
        nEndX = e.pageX - offset.left;
        nEndY = e.pageY - offset.top;
        if(bIsPaint) {
           rectTip.css({left: nX + offset.left - ctx.lineWidth/2, top: nY - ctx.lineWidth/2});
           rectTip.width(nEndX - nX - ctx.lineWidth);
           rectTip.height(nEndY - nY - ctx.lineWidth);
           rectTip.show();
        }
  	}

  	function fDrawRect(e) {
  		console.log(nX + "," + nY);
	    ctx.strokeRect(nX, nY, nEndX - nX, nEndY - nY);
	 	$("#board").focus(); 
	    rectTip.hide();
  	}
});