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
	var nX, nY, nEndX, nEndY;
	var bIsPaint = false; //绘制标识
	var ctx = $("#board").get(0).getContext("2d");
	var sType = "画笔"; //工具类型
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
			// case "矩形": 
			// 	fDrawFree(e);
			// 	break;
			// case "正方形": 
			// 	fDrawFree(e);
			// 	break;
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
		//判断工具类型执行相应函数
		switch(sType) {
		 	case "画笔":
		 		break;
          	case "橡皮":
          		break;
   //        	case 4:	
   //        		lineTip.show(); 
   //        		break;
   //        	case 5: {
			//     var borderColor = "#"+ $("#colorpicker-popup").val();
			//     var borderWidth  = $("#penWidth").val()+"px"; 
			//     var sr = borderColor +" "+borderWidth+ " solid";
			//     var backgroundColor ="#"+$("#colorpicker-popup2").val();
			//     rectTip.css({
			// 	   "border": sr,
			// 	   "background-color":backgroundColor
			//     });
			// 	rectTip.show();
			// 	break;    
			// }
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
          	// case "矩形":
          	// 	fDrawRect();
          	// 	break;
          	// case 6:	
          	// 	fontTip.focus();
          	// 	break;
		}
  	});

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
});