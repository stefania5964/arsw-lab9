var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;
    var idDraw = null;    
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var idS = document.querySelector("#idDraw");

    var loadEventPointer = function () {
        if (idS) idS.addEventListener('change', updateId);        
        const eventCanvas = (window.PointerEvent)?'pointerdown':'mousedown';
        canvas.addEventListener(eventCanvas, eventPoint);
    }
    
    var updateId = function(event){
        idDraw = event.target.value;
        console.log(`nuevoValor ${idDraw}`);
    }

    var eventPoint = function (event){
        const {x,y} = getMousePosition(event);                
        if(idDraw) app.publishPoint(x,y);
    }

    var addPointToCanvas = function (point) {                
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    var drawPolygon = function(points){
        canvas.width = canvas.width;
        var {x,y} = points[0];
        ctx.moveTo(x,y);
        points.forEach(point => {            
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.lineTo(point.x,point.y);
        });
        ctx.lineTo(x,y);
        ctx.stroke();
    }
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            canvas.width = canvas.width;
            stompClient.subscribe(`/topic/newpoint.${idDraw}`, function (eventbody) {
                const point=JSON.parse(eventbody.body);                
                console.log(point);
                addPointToCanvas(point);                
            });
            stompClient.subscribe(`/topic/newpolygon.${idDraw}`, function (eventbody) {
                const points = JSON.parse(eventbody.body);
                drawPolygon(points);
            });
            stompClient.subscribe(`/topic/queue.${idDraw}`, function (eventbody) {
                const points = JSON.parse(eventbody.body);
                if( points.length  < 3 ){
                    points.forEach(point => addPointToCanvas(point));
                    return;
                }
                drawPolygon(points);
            });
            //stompClient.send(`/app/queue.${idDraw}`, {});
        });
    };

    return {

        init: function () {            
            loadEventPointer();                        
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);

            //publicar el evento
            stompClient.send(`/app/newpoint.${idDraw}`, {}, JSON.stringify(pt));
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        },

        publishDraw(id){
            idDraw = id;
            connectAndSubscribe();
        }
    };

})();