/// <reference path="../typings/jquery/jquery.d.ts"/>
function Mand(eventTagIDList,screenshotDimensions,cPlaneInitVars,iterations) {
    'use strict';

    //private members
    var mouseDownLocation;
    $('#' + eventTagIDList.canvas).on('mousedown',
        function(e) {
            mouseDownLocation = { x: e.offsetX,y: e.offsetY };
        });

    //Accessing variables above your current scope creates closure.
    $('#' + eventTagIDList.canvas).on('mouseup',
        function(e) {
            var canvasCWidth = currentCPlaneInitVars.cWidth;
            var canvasCHeight = canvasCWidth*canvasAspect;
            var xScreenPercentMove = (e.offsetX - mouseDownLocation.x) / canvasWidth;
            var yScreenPercentMove = (e.offsetY - mouseDownLocation.y) / canvasHeight;

            currentCPlaneInitVars.cMidPoint.real -= (canvasCWidth*xScreenPercentMove);
            currentCPlaneInitVars.cMidPoint.imaginary += (canvasCHeight*yScreenPercentMove);
            renderToCanvas(eventTagIDList.canvas);
        });

    $('#' + eventTagIDList.reset).on('click',
        function(e) {
            currentCPlaneInitVars = copyInitVars(startCPlaneInitVars);
            renderToCanvas(eventTagIDList.canvas);
        });

    $('#' + eventTagIDList.zoomIn).on('click',
        function(e) {
            var zFactor = 2.0;
            var lastCWidth = currentCPlaneInitVars.cWidth;
            currentCPlaneInitVars.cWidth = currentCPlaneInitVars.cWidth/zFactor;
            currentCPlaneInitVars.cMidPoint.real += ((lastCWidth - currentCPlaneInitVars.cWidth) * 0.5);
            renderToCanvas(eventTagIDList.canvas);
        });

    $('#' + eventTagIDList.zoomOut).on('click',
        function(e) {
            var zFactor = 2.0;
            var lastCWidth = currentCPlaneInitVars.cWidth;
            currentCPlaneInitVars.cWidth = currentCPlaneInitVars.cWidth*zFactor;
            currentCPlaneInitVars.cMidPoint.real -= ((currentCPlaneInitVars.cWidth -lastCWidth) * 0.5);
            renderToCanvas(eventTagIDList.canvas);
        });

    $('#' + eventTagIDList.screenshot).on('click',
        function(e) {
            $('#' + eventTagIDList.screenshot).
            append("<div id='screenshotCanvasTag' class='hiddenCanvas'></div>");
            $('#screenshotCanvasTag').html("<canvas id='canvasScreenshot' class='hiddenCanvas' width='" + screenshotDimensions.width + "' height='" + screenshotDimensions.height + "'></canvas>");
            renderToCanvas("#canvasScreenshot",screenshotDimensions.iterations);
            document.getElementById(eventTagIDList.screenshot).href = $("#canvasScreenshot").get(0).toDataURL('image/png');
            $('#screenshotCanvasTag').html("");
        });

    var mandCanvasElement = $(eventTagIDList.canvas).get(0);
    var canvasWidth = mandCanvasElement.width;
    var canvasHeight = mandCanvasElement.height;
    var canvasAspect = (canvasHeight/canvasWidth);

    var index;
    var setPixel = function(iData, canvasLocation, c) {
        index = (canvasLocation.x + canvasLocation.y * iData.width) * 4;
        iData.data[index+0] = c.r;
        iData.data[index+1] = c.g;
        iData.data[index+2] = c.b;
        iData.data[index+3] = c.a;
    };

    cPlaneInitVars.toStats = function() {
        return '{<br/>&nbsp;&nbsp;&nbsp;&nbsp;cMidPoint: { real: ' + this.cMidPoint.real + ',' +
            'imaginary: ' + this.cMidPoint.imaginary + '},<br/>' +
            '&nbsp;&nbsp;&nbsp;&nbsp;cWidth: ' + this.cWidth +
            '<br/>}';
    };

    //deep copy
    var copyInitVars = function(initVars)
    {
        return {
            cMidPoint: { real: initVars.cMidPoint.real, 
                        imaginary: initVars.cMidPoint.imaginary },
            cWidth:initVars.cWidth,
            toStats:initVars.toStats
        }
    };
    
    var currentCPlaneInitVars = copyInitVars(cPlaneInitVars);
    var startCPlaneInitVars = copyInitVars(cPlaneInitVars);
    
    var showStats = function(stats) {
        $('#' + eventTagIDList.statsSection).html('<br/>' +stats);
    }
    
    var renderToCanvas = function(canvasID) {
        
        var element = $(canvasID).get(0);
        var canvas = element.getContext('2d');
        var imageData = canvas.createImageData(element.width, element.height);
        
        var cPlane = new Mand.ComplexPlane(
            currentCPlaneInitVars, 
            element.width,
            element.height,
            iterations
         );
        
        do {
            setPixel(imageData,cPlane.canvasLocation,cPlane.getCColor());
        } while(cPlane.moveC());
        
        canvas.putImageData(imageData, 0, 0);
        showStats(currentCPlaneInitVars.toStats());
    }
    
    //public members
    this.iterations = iterations;
        
    //render initial image
    renderToCanvas(eventTagIDList.canvas);
};
//static members
Mand.ComplexPlane = function(initVars, canvasWidth, canvasHeight,iterations) {
    
    this.iterations = iterations;
    
    this.width = initVars.cWidth;
    this.height = this.width * (canvasHeight/canvasWidth);
    this.c = {
        real: initVars.cMidPoint.real,
        imaginary: initVars.cMidPoint.imaginary + this.height/2.0
    };
    this.realStartAxis =  this.c.real;
    this.realEnd = this.c.real + this.width;
    this.imaginaryEnd = this.c.imaginary - this.height;
    this.moveAmountReal = this.width/canvasWidth;
    this.moveAmountImaginary = this.height/canvasHeight;
    
    this.canvasLocation = { x:0 , y:0 };
    
    this.moveC = function()
    { 
        this.c.real += this.moveAmountReal;
        this.canvasLocation.x += 1;
        if(this.c.real > this.realEnd)
        {
            this.c.real = this.realStartAxis;
            this.canvasLocation.x = 0;
            
            this.c.imaginary -= this.moveAmountImaginary;
            this.canvasLocation.y += 1;
        }
        
        if(this.c.imaginary < this.imaginaryEnd)
            return false;
        
        return true; 
    };
    
    this.getCColor = function () {
        var z = { real: 0, imaginary: 0 };
        var inSet = true;
        var i;
        for (i = 0; i < this.iterations; i++) {
            z = {
                real: z.real * z.real - z.imaginary * z.imaginary + this.c.real,
                imaginary: z.real * z.imaginary * 2 + this.c.imaginary
            };

            if (z.real * z.real + z.imaginary * z.imaginary > 4) {
                inSet = false;
                break;
            }
        }
        
        i= (i*i*i*i*i*i)*0.00000000002;
        if (inSet) return { r: 0, g: 0, b: 0, a: 255 };
        return { r: i, g:i*0.3, b: 0, a: 255 };
        
    };
};







