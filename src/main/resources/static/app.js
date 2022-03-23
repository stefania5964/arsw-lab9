var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;
    var idDraw = null;
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
        const pt = getMousePosition(event);        
        addPointToCanvas(pt);
        if(idDraw) stompClient.send(`/topic/newpoint.${idDraw}`, {}, JSON.stringify(pt));
    }

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
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
                const jsonObject=JSON.parse(eventbody.body);
                //alert(jsonObject);
                console.log(jsonObject);
                addPointToCanvas(jsonObject);                
            });
        });
    };

    return {

        init: function () {
            //var can = document.getElementById("canvas");
            loadEventPointer();                        
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);

            //publicar el evento
            stompClient.send(`/topic/newpoint.${idDraw}`, {}, JSON.stringify(pt));
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